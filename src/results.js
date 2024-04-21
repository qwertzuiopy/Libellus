/* results.js
 *
 * Copyright 2023 Michael Hammer
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';

import { get_sync, get_any_async, score_to_modifier, bookmarks, toggle_bookmarked, is_bookmarked, save_state } from "./window.js";
import { BigDiv, Div, Card, Link, LinkCard, ModuleCardRow, ModuleText, ModuleTitle, ModuleLevelRow, ImageAsync, ModuleLinkListRow, ModuleShortLinkListRow, ModuleStatListRow, ModuleLinkList, ModuleNTable, Module2Table, ModuleMultiText } from "./modules.js";

export const SearchResult = GObject.registerClass({
  GTypeName: 'SearchResult',
}, class extends Adw.ActionRow {
  constructor(data, type) {
    super({title_lines: 1});
    this.data = data;
    this.type = type;

    // for searching
    this.name = this.data.name;

    this.set_title(this.data.name);
    this.set_subtitle(this.data.url
      .split("/")[2]
      .split("-")
      .map((str) => { return str.charAt(0).toUpperCase() + str.slice(1); } )
      .join(" "));
    this.arrow = new Gtk.Image({ iconName: "go-next-symbolic" });
    this.add_suffix(this.arrow);
    this.set_activatable(true);

  }
});



const ResultPage = GObject.registerClass({
  GTypeName: 'ResultPage',
}, class extends Gtk.ScrolledWindow {
  constructor(data, navigation_view) {
    super({
      halign: Gtk.Align.FILL,
      hexpand: true,
      hscrollbar_policy: Gtk.PolicyType.NEVER });

    this.navigation_view = navigation_view;

    this.data = data;

    this.bookmark_accel = () => {
      if (toggle_bookmarked ({ name: this.data.name, url: this.data.url })) {
        this.pin.set_css_classes(["success"]);
      } else {
        this.pin.set_css_classes([]);
      }
    }

    this.back_wrapper = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    this.set_child(this.back_wrapper);

    this.pin = new Gtk.Button({
      icon_name: "star-large-symbolic",
      halign: Gtk.Align.END, hexpand: true,
      margin_top: 20, margin_end: 20 });

    if (is_bookmarked ({ name: this.data.name, url: this.data.url })) {
      this.pin.add_css_class("success");
    }
    this.pin.connect("clicked", () => {
      if (toggle_bookmarked ({ name: this.data.name, url: this.data.url })) {
        this.pin.set_css_classes(["success"]);
      } else {
        this.pin.set_css_classes([]);
      }
    } );

    this.bar = new Gtk.Box( {
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
      halign:Gtk.Align.FILL } );

    this.bar.append(this.pin);
    this.back_wrapper.append(this.bar);

    this.clamp = new Adw.Clamp({
      maximum_size: 800,
      margin_start: 20, margin_end: 20, margin_bottom: 20 });
    this.back_wrapper.append(this.clamp);
    this.wrapper = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 20 });
    this.clamp.add_css_class("undershoot-top");
    this.clamp.add_css_class("undershoot-bottom");
    this.clamp.set_child(this.wrapper);

    if (this.data.full_name) {
      this.wrapper.append(new ModuleTitle(this.data.full_name, 1));
    } else {
      this.wrapper.append(new ModuleTitle(this.data.name, 1));
    }

    this.update_title = () => {
      this.navigation_view.tab_page.set_title(this.data.name);
    }
    this.update_title();
  }
});

export const SearchResultPageSpell = GObject.registerClass({
  GTypeName: 'SearchResultPageSpell',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    let cards = [];
    cards.push(new Card("Level", this.data.level.toString()));
    cards.push(new Card("Casting Time", this.data.casting_time));

    if (this.data.area_of_effect) {
      cards.push(new Card("Range",
        this.data.range
        + " (" + this.data.area_of_effect.size.toString() + "ft "
        + this.data.area_of_effect.type + ")"));
    } else {
      cards.push(new Card("Range", this.data.range));
    }

    cards.push(new Card("Components", this.data.components.join(", ")));
    cards.push(new Card("Duration", this.data.duration));
    cards.push(new LinkCard("School",
      this.data.school.name,
      this.data.school,
      this.navigation_view));

    if (this.data.attack_type) {
      cards.push(new Card("Attack", this.data.attack_type));
    } else if (this.data.dc) {
      cards.push(new Card("Save", this.data.dc.dc_type.name + " Save"));
    }

    if (this.data.damage) {
      cards.push(new Card("Damage", this.data.damage.damage_type.name));
    } else {
      cards.push(new Card("Effect", "Buff"));
    }

    this.wrapper.append(new BigDiv(cards));

    this.wrapper.append(new ModuleTitle("Effect", 3));
    this.wrapper.append(new ModuleMultiText(this.data.desc));
    if (this.data.higher_level && this.data.higher_level.length > 0) {
      this.wrapper.append(new ModuleTitle("At higher Levels", 3));
      this.wrapper.append(new ModuleText(this.data.higher_level[0]));
    }

    if (this.data.damage && this.data.damage.damage_at_character_level) {
      this.wrapper.append(
        new Module2Table(
          this.data.damage.damage_at_character_level,
          "Character Level",
          "Damage"));
    }
    if (this.data.damage && this.data.damage.damage_at_slot_level) {
      this.wrapper.append(
        new Module2Table(
          this.data.damage.damage_at_slot_level,
          "Slot Level",
          "Damage"));
    }
    if (this.data.heal_at_slot_level) {
      this.wrapper.append(
        new Module2Table(
          this.data.heal_at_slot_level,
          "Slot Level",
          "Heal"));
    }

    this.wrapper.append(new ModuleLinkList(this.data.classes.map((i) => {
      return { item: i };
    } ), navigation_view ));

  }
});
export const SearchResultPageArmor = GObject.registerClass({
  GTypeName: 'SearchResultPageArmor',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new LinkCard(
      "Category",
      this.data.equipment_category.name,
      this.data.equipment_category,
      navigation_view));

    cards.push(new Card("Cost", this.data.cost.quantity.toString() + this.data.cost.unit));
    cards.push(new Card("Weight", this.data.weight.toString() + "lb"));
    cards.push(new Card("Armor Class", this.data.armor_class.base.toString()
      + (this.data.armor_class.dex_bonus ? " + Dex"
      + (this.data.armor_class.max_bonus ? " (max "
      + this.data.armor_class.max_bonus.toString()
      + ")" : "") : "")));

    if (this.data.str_minimum != 0) {
      cards.push(new Card("Strength", "min " + this.data.str_minimum.toString()));
    }

    if (this.data.stealth_disadvantage != 0) {
      cards.push(new Card("Stealth", "disadvantage"));
    }

    cards.push(new Card("Type", this.data.armor_category));

    this.wrapper.append(new BigDiv(cards));
  }
});

export const SearchResultPageGear = GObject.registerClass({
  GTypeName: 'SearchResultPageGear',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new LinkCard(
      "Category",
      this.data.equipment_category.name,
      this.data.equipment_category,
      navigation_view));

    if (!this.data.quantity) {
      cards.push(new Card("Cost", this.data.cost.quantity.toString() + this.data.cost.unit));
    } else {
      cards.push(new Card("Cost", this.data.cost.quantity.toString()
        + this.data.cost.unit
        + " per "
        + this.data.quantity.toString()));
    }

    if (this.data.weight) {
      if (!this.data.quantity) {
        cards.push(new Card("Weight", this.data.weight.toString() + "lb"));
      } else {
        cards.push(new Card("Weight", this.data.weight.toString()
          + "lb per "
          + this.data.quantity.toString()));
      }
    }

    if (this.data.gear_category) cards.push(new Card("Type", this.data.gear_category.name));
    else if (this.data.vehicle_category) cards.push(new Card("Type", this.data.vehicle_category));
    else if (this.data.tool_category) cards.push(new Card("Type", this.data.tool_category));
    else if (this.data.weapon_category) cards.push(new Card("Type", this.data.weapon_category));

    if (this.data.weapon_range) {
      cards.push(new Card("Range", this.data.weapon_range));
    }

    this.wrapper.append(new BigDiv(cards));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    let counter = 0;
    if (this.data.range) {
      if (this.data.range.long) {
        this.statrows.append(new ModuleStatListRow("Range",
          [this.data.range.normal.toString()
          + " ft normal", this.data.range.long.toString()
          + " ft long"]));
      } else {
        this.statrows.append(new ModuleStatListRow("Range",
          [this.data.range.normal.toString() + " ft"]));
      }
      counter ++;
    }
    if (this.data.damage) {
      this.statrows.append(new ModuleStatListRow("Damage",
        [this.data.damage.damage_dice + " "
        + this.data.damage.damage_type.name]));
    }
    if (this.data.properties) {
      this.statrows.append(new ModuleShortLinkListRow("Properties", this.data.properties, this.navigation_view));
    }

    if (counter > 0) this.wrapper.append(this.statrows);

    if (this.data.desc && this.data.desc.length > 0) {
      this.wrapper.append(new ModuleTitle("Description", 3));
      this.wrapper.append(new ModuleMultiText(this.data.desc));
    }


  }
});
export const SearchResultPageMagicGear = GObject.registerClass({
  GTypeName: 'SearchResultPageMagicGear',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new Card("Rarity", this.data.rarity.name));
    this.wrapper.append(new ModuleCardRow(cards));

    if (this.data.desc.length > 0) {
      this.wrapper.append(new ModuleTitle("Description", 3));
      this.wrapper.append(new ModuleMultiText(this.data.desc));
    }
    if (this.data.variants.length > 0) {
      this.wrapper.append(new ModuleLinkList(this.data.variants.map( (i) => {
        return { item: i };
      } ), this.navigation_view));
    }

  }
});
export const SearchResultPageBundle = GObject.registerClass({
  GTypeName: 'SearchResultPageBundle',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new LinkCard(
      "Category",
      this.data.equipment_category.name,
      this.data.equipment_category,
      navigation_view));

    if (!this.data.quantity) {
      cards.push(new Card("Cost", this.data.cost.quantity.toString() + this.data.cost.unit));
    } else {
      cards.push(new Card("Cost", this.data.cost.quantity.toString()
        + this.data.cost.unit
        + " per " + this.data.quantity.toString()));
    }

    if (this.data.gear_category) cards.push(new Card("Type", this.data.gear_category.name));
    else if (this.data.vehicle_category) cards.push(new Card("Type", this.data.vehicle_category));
    else if (this.data.tool_category) cards.push(new Card("Type", this.data.tool_category));

    this.wrapper.append(new BigDiv(cards));

    if (this.data.desc && this.data.desc.length > 0) {
      this.wrapper.append(new ModuleTitle("Description", 3));
      this.wrapper.append(new ModuleMultiText(this.data.desc));
    }

    this.content_list = new ModuleLinkList(this.data.contents, this.navigation_view);
    this.wrapper.append(this.content_list);

  }
});

export const SearchResultPageSchool = GObject.registerClass({
  GTypeName: 'SearchResultPageSchool',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;
    this.wrapper.append(new ModuleText(this.data.desc));
  }
});

export const SearchResultPageAlignment = GObject.registerClass({
  GTypeName: 'SearchResultPageAlignment',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;
    this.wrapper.append(new ModuleText(this.data.desc));
  }
});

export const SearchResultPageSkill = GObject.registerClass({
  GTypeName: 'SearchResultPageSkill',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;

    let cards = [];
    cards.push(new LinkCard(
      "Ability Score",
      get_sync(this.data.ability_score.url).full_name,
      this.data.ability_score,
      this.navigation_view));

    this.wrapper.append(new BigDiv(cards));
    this.wrapper.append(new ModuleMultiText(this.data.desc));
  }
});

export const SearchResultPageAbilityScore = GObject.registerClass({
  GTypeName: 'SearchResultPageAbilityScore',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;

    this.wrapper.append(new ModuleMultiText(this.data.desc));

    this.wrapper.append(new ModuleLinkList(this.data.skills.map( (i) => {
      return { item: i };
    } ), this.navigation_view));

  }
});


export const SearchResultPageEquipmentCategory = GObject.registerClass({
  GTypeName: 'SearchResultPageEquipmentCategory',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;

    this.wrapper.append(new ModuleLinkList(this.data.equipment.map( (i) => {
      return { item: i };
    } ), this.navigation_view));

  }
});

export const SearchResultPageFeature = GObject.registerClass({
  GTypeName: 'SearchResultPageFeature',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.data = data;

    let cards = [];
    cards.push(new Card("Level", this.data.level.toString()));

    this.wrapper.append(new BigDiv(cards));

    this.wrapper.append(new ModuleMultiText(this.data.desc));
    let arr = [];
    arr.push({item: this.data.class});
    if (this.data.sub_class) arr.push({item: this.data.sub_class});
    this.wrapper.append(new ModuleLinkList(arr, this.navigation_view));
  }
});



export const SearchResultPageMonster = GObject.registerClass({
  GTypeName: 'SearchResultPageMonster',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    if (this.data.image) {
      this.wrapper.append(new ImageAsync(this.data.image));
    }

    let cards = [];
    cards.push(new Card("Strength", this.data.strength.toString() + " / " + score_to_modifier(this.data.strength.toString())));
    cards.push(new Card("Dexterity", this.data.dexterity.toString() + " / " + score_to_modifier(this.data.dexterity.toString())));
    cards.push(new Card("Constitution", this.data.constitution.toString() + " / " + score_to_modifier(this.data.constitution.toString())));
    cards.push(new Card("Intelligence", this.data.intelligence.toString() + " / " + score_to_modifier(this.data.intelligence.toString())));
    cards.push(new Card("Wisdom", this.data.wisdom.toString() + " / " + score_to_modifier(this.data.wisdom.toString())));
    cards.push(new Card("Charisma", this.data.charisma.toString() + " / " + score_to_modifier(this.data.charisma.toString())));

    cards.push(new LinkCard("Alignment", this.data.alignment.toString(), {
      name: this.data.alignment.toString().split(" ").join("-"),
      url: "/api/alignments/"
        + this.data.alignment.toString().split(" ").join("-")
      }, this.navigation_view));

    cards.push(new Card("Armor Class", this.data.armor_class[0].value.toString()));

    if (this.data.hit_dice) {
      cards.push(new Card("Hit Dice", this.data.hit_dice.toString()));
    }

    cards.push(new Card("Type", this.data.type));

    if (this.data.subtype) {
      cards.push(new Card("Subtype", this.data.subtype));
    }

    cards.push(new Card("Challenge Rating", this.data.challenge_rating.toString()));
    cards.push(new Card("Size", this.data.size));

    let s = [];
    if (this.data.speed.walk)   s.push(this.data.speed.walk + " walk");
    if (this.data.speed.swim)   s.push(this.data.speed.swim + " swim");
    if (this.data.speed.fly)    s.push(this.data.speed.fly + " fly");
    if (this.data.speed.burrow) s.push(this.data.speed.burrow + " burrow");
    if (this.data.speed.climb) s.push(this.data.speed.climb + " climb");
    cards.push(new Card("Speed", s.join(", ")));

    cards.push(new Card("Hit Points", this.data.hit_points.toString() + " / " + this.data.hit_points_roll));

    this.wrapper.append(new BigDiv(cards));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    this.wrapper.append(this.statrows);

    this.statrows.append(new ModuleStatListRow("Languages", this.data.languages.split(", ")));

    s = [];
    if (this.data.senses.blindsight  != undefined) s.push("blindsight "+this.data.senses.blindsight);
    if (this.data.senses.darkvision  != undefined) s.push("darkvision "+this.data.senses.darkvision);
    if (this.data.senses.tremorsense != undefined) s.push("tremorsense "+this.data.senses.tremorsense);
    if (this.data.senses.truesight   != undefined) s.push("truesight "+this.data.senses.truesight);
    this.statrows.append(new ModuleStatListRow("Senses", s));

    this.statrows.append(new ModuleStatListRow("Saving Throws", this.data.proficiencies.filter((i) => {
      return i.proficiency.name.includes("Saving Throw");
    } ).map( (i) => {
      return "+"
        + i.value.toString() + " "
        + i.proficiency.index.slice(i.proficiency.index.lastIndexOf("-")+1, i.proficiency.index.length)
    } )));

    this.statrows.append(new ModuleStatListRow("Skills", this.data.proficiencies.filter((i) => {
      return i.proficiency.name.includes("Skill");
    } ).map( (i) => {
      return "+"
        + i.value.toString() + " "
        + i.proficiency.index.slice(i.proficiency.index.lastIndexOf("-")+1, i.proficiency.index.length)
      } )));

    if (this.data.desc) this.wrapper.append(new ModuleText(this.data.desc));

    if (this.data.special_abilities)  {
      this.wrapper.append(new ModuleTitle("Abilities", 4));
      this.wrapper.append(new ModuleMultiText(this.data.special_abilities.map( (i) => {
        // "***" gets interpreted as a list item by ModuleMultiText
        return "***"
          + (!i.usage ? i.name : (i.name + " (" +i.usage.times+" "+i.usage.type+")" ))
          + ".***" + i.desc;
        } )));
    }

    if (this.data.actions) {
      this.wrapper.append(new ModuleTitle("Actions", 4));
      this.wrapper.append(new ModuleMultiText(this.data.actions.map( (i) => {
        return "***"
          + (!i.usage ? i.name : (i.name + " (" +i.usage.times+" "+i.usage.type+")" ))
          + ".***" + i.desc;
        } )));
    }

    if (this.data.legendary_actions && this.data.legendary_actions.length > 0) {
      this.wrapper.append(new ModuleTitle("Legendary Actions", 4));
      this.wrapper.append(new ModuleMultiText(this.data.legendary_actions.map( (i) => {
        return "***"
          + (!i.usage ? i.name : (i.name + " (" +i.usage.times+" "+i.usage.type+")" ))
          + ".***" + i.desc;
        } )));
    }
  }
});

export const SearchResultPageClass = GObject.registerClass({
  GTypeName: 'SearchResultPageClass',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new Card("Hit die", "d"
      + this.data.hit_die.toString()
      + " ("+Math.ceil(this.data.hit_die / 2 +0.5) + ")"));

    cards.push(new Card("HP at Level 1", "Constitution + " + this.data.hit_die ));
    if (this.data.spellcasting) {
      cards.push(new LinkCard(
        "Spellcasting",
        this.data.spellcasting.spellcasting_ability.name,
        this.data.spellcasting.spellcasting_ability,
        this.navigation_view));
    } else {
      cards.push(new Card("Spellcasting", "none"));
    }

    this.wrapper.append(new BigDiv(cards));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    this.wrapper.append(this.statrows);

    for (let i in this.data.proficiency_choices) {
      if (!this.data.proficiency_choices[i].from.options[0].item) {
        this.statrows.append(new ModuleStatListRow(this.data.proficiency_choices[i].desc, []));
      } else {
        let s = "";
        let arr = this.data.proficiency_choices[i].from.options;
        arr = arr.map((i) => { return get_sync(i.item.url).reference; } );
        if (this.data.proficiency_choices[i].from.options[0].item.name.includes("Skill")) {
          s = "Skills: Choose "+this.data.proficiency_choices[i].choose.toString();
        } else {
          s = this.data.proficiency_choices[i].desc;
        }
        this.statrows.append(new ModuleLinkListRow(s, arr, this.navigation_view));
      }
    }

    this.statrows.append(new ModuleLinkListRow("Proficiencies", this.data.proficiencies.filter((i) => {
      return !i.url.includes("saving-throw")
    }).map((i) => {
      return get_sync(i.url).reference;
    } ), this.navigation_view));

    this.statrows.append(new ModuleShortLinkListRow(
      "Saving Throws",
      this.data.saving_throws,
      this.navigation_view));

    if (this.data.spellcasting) {
      this.wrapper.append(new ModuleTitle("Spellcasting", 4));
      let arr = this.data.spellcasting.info.map((i) => {
        return "***" + i.name + ".***" + i.desc.join("###");
      });
      this.wrapper.append(new ModuleMultiText(arr));
    }

    this.wrapper.append(new ModuleTitle("Starting Equipment", 4));
    if (this.data.starting_equipment.length > 0) {
      this.wrapper.append(new ModuleLinkList(this.data.starting_equipment.map((i) => {
        return { item: {
          url: i.equipment.url,
          name: i.quantity > 1 ? (i.quantity.toString() + "x "+  i.equipment.name) : i.equipment.name }
        };
      } ), this.navigation_view));
    }

    this.wrapper.append(new ModuleMultiText(this.data.starting_equipment_options.map((i) => i.desc ), 4));

    this.wrapper.append(new ModuleTitle("Subclasses", 4));
    this.wrapper.append(new ModuleLinkList(this.data.subclasses.map((i) => {
      return { item: i};
    } ), this.navigation_view));

    let level_data = get_sync(this.data.class_levels);

    let level_select = new Gtk.Box( { halign: Gtk.Align.CENTER, spacing: 10 } );
    this.wrapper.append(level_select);

    level_select.append(new Gtk.Label( {
      label: "Stats on Level",
      css_classes: ["title-4"] } ));

    this.level_spin = Gtk.SpinButton.new_with_range(1, 20, 1);
    level_select.append(this.level_spin);

    this.level_children = [];
    this.level_box = new Gtk.Box( {
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 30 } );
    this.wrapper.append(this.level_box);

    this.update_levels = () => {
      for (let i in this.level_children) {
        this.level_box.remove(this.level_children[i]);
      }
      this.level_children = [];

      let d = level_data[this.level_spin.value-1];
      if (d.spellcasting) {
        let t = {};
        let n = 0;
        for (let i in d.spellcasting) {
          if (!i.includes("known")) {
            n++;
            t[n] = d.spellcasting[i].toString();
          }
        }
        this.level_children.push(new Module2Table(t, "Slot Level", "Spell Slots"));
      }

      cards = [];
      if (d.prof_bonus) cards.push(new Card("Proficiency bonus", "+" + d.prof_bonus.toString()));
      if (d.spellcasting && d.spellcasting.spells_known) cards.push(new Card("Spells known", d.spellcasting.spells_known.toString()));
      if (d.spellcasting && d.spellcasting.cantrips_known) cards.push(new Card("Cantrips known", d.spellcasting.cantrips_known.toString()));

      let c = d.class_specific;
      for (let i in c) {
        if (typeof c[i] == "object") {
          for (let j in c[i]) {
            cards.push(new Card(
              i.split("_").join(" ") + ": " + j.split("_").join(" "),
              c[i][j].toString()));
          }
        } else {
          cards.push(new Card(i.split("_").join(" "), c[i].toString()));
        }
      }

      this.level_children.push(new BigDiv(cards));

      for (let i in this.level_children) {
        this.level_box.append(this.level_children[i]);
      }
    }

    this.update_levels();
    this.level_spin.connect("notify::value", this.update_levels);


    this.wrapper.append(new ModuleTitle("Features", 4));
    let level_list = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    for (let i in level_data) {
      level_list.append(new ModuleLevelRow(level_data[i], this.navigation_view));
    }
    this.wrapper.append(level_list);
  }
});

export const SearchResultPageSubclass = GObject.registerClass({
  GTypeName: 'SearchResultPageSubclass',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    this.wrapper.append(new ModuleMultiText(data.desc));

    let level_data = get_sync(this.data.subclass_levels);

    this.wrapper.append(new ModuleTitle("Features", 4));
    let level_list = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    for (let i in level_data) {
      level_list.append(new ModuleLevelRow(level_data[i], this.navigation_view));
    }
    this.wrapper.append(level_list);

    if (this.data.spells) {
      let spells = this.data.spells.map((i) => {
        return {
          name: i.spell.name + ": " + i.prerequisites.map((j) => {
            if ( j.type != "level") {
              log("ERROR subclass spells");
            }
            return "Level"+j.name.slice(-2);
          }).join(" "),
          url: i.spell.url }
        } );
      this.wrapper.append(new ModuleLinkList(spells.map((i) => {
        return { item: i };
      } ), navigation_view));
    }


    if (level_data[0].subclass_specific) {
      let specific = [["Level"]];
      for (let j in level_data[0].subclass_specific) {
        specific[0].push(j.split("_").join(" "));
      }
      for (let i in level_data) {
        specific[i+1] = [i];
        for (let j in level_data[i].subclass_specific) {
          specific[i+1].push(level_data[i].subclass_specific[j].toString());
        }
      }
      this.wrapper.append(new Adw.Bin( {
        css_classes: ["card"],
        child: new ModuleNTable(specific)
      } ));
    }

  }
});




export const SearchResultPageRace = GObject.registerClass({
  GTypeName: 'SearchResultPageRace',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new Card("Speed", this.data.speed + "ft"));
    cards.push(new Card("Size", this.data.size));
    this.wrapper.append(new BigDiv(cards));

    this.wrapper.append(new ModuleMultiText([
      "***Age.***"+this.data.age,
      "***Alignment.***"+this.data.alignment,
      "***Languages.***"+this.data.language_desc,
      "***Size.***"+this.data.size_description]));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    this.wrapper.append(this.statrows);
    for (let i in this.data.starting_proficiency_choices) {
      if (!this.data.starting_proficiency_choices[i].from.options[0].item) {
        this.statrows.append(new ModuleStatListRow(this.data.starting_proficiency_choices[i].desc, []));
      } else {
        let s = "";
        let arr = this.data.starting_proficiency_choices[i].from.options;
        arr = arr.map((i) => { return get_sync(i.item.url).reference; } );
        if (this.data.starting_proficiency_choices[i].from.options[0].item.name.includes("Skill")) {
          s = "Skills: Choose "+this.data.starting_proficiency_choices[i].choose.toString();
        } else {
          s = this.data.starting_proficiency_choices[i].desc;
        }
        this.statrows.append(new ModuleLinkListRow(s, arr, this.navigation_view));
      }
    }

    this.statrows.append(new ModuleShortLinkListRow("Proficiencies", this.data.starting_proficiencies.filter((i) => {
      return !i.url.includes("saving-throw")
    }).map((i) => {
      return get_sync(i.url).reference;
    } ), this.navigation_view));

    this.statrows.append(new ModuleStatListRow("Ability bonuses", this.data.ability_bonuses.map((i) => {
      return "+" + i.bonus.toString() + " " +i.ability_score.name;
    } )));

    this.statrows.append(new ModuleStatListRow("Languages", this.data.languages.map((i) => i.name)));

    this.wrapper.append(new ModuleTitle("Traits", 4));
    this.wrapper.append(new ModuleLinkList(this.data.traits.map((i) => {
      return { item: i };
    }), this.navigation_view));

    this.wrapper.append(new ModuleTitle("Subraces", 4));
    this.wrapper.append(new ModuleLinkList(this.data.subraces.map((i) => {
      return { item: i};
    } ), this.navigation_view));

  }
});
export const SearchResultPageSubrace = GObject.registerClass({
  GTypeName: 'SearchResultPageSubrace',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    let cards = [];
    cards.push(new LinkCard("Race", this.data.race.name, this.data.race, this.navigation_view));
    this.wrapper.append(new BigDiv(cards));

    this.wrapper.append(new ModuleText(this.data.desc));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    this.wrapper.append(this.statrows);

    this.statrows.append(new ModuleShortLinkListRow("Proficiencies", this.data.starting_proficiencies.filter((i) => {
      return !i.url.includes("saving-throw");
    }).map((i) => {
      return get_sync(i.url).reference;
    } ), this.navigation_view));

    this.statrows.append(new ModuleStatListRow("Ability bonuses", this.data.ability_bonuses.map((i) => {
      return "+" + i.bonus.toString() + " " +i.ability_score.name;
    } )));

    this.statrows.append(new ModuleStatListRow("Languages", this.data.languages.map((i) => i.name)));

    this.wrapper.append(new ModuleTitle("Traits", 4));
    this.wrapper.append(new ModuleLinkList(this.data.racial_traits.map((i) => {
      return { item: i };
    }), this.navigation_view));


  }
});


export const SearchResultPageTrait = GObject.registerClass({
  GTypeName: 'SearchResultPageTrait',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);

    this.wrapper.append(new ModuleMultiText(this.data.desc));

    this.statrows = new Gtk.ListBox( { css_classes: ["boxed-list"] } );
    let hascontent = false;
    // for some unholy reason this.data.proficiency_choices isn't an array in the API like literally everywhere else!
    // and does not have the same attributes
    if (this.data.proficiency_choices) {
      hascontent = true;
      let s = "Choose " + this.data.proficiency_choices.choose + ":";
      let arr = this.data.proficiency_choices.from.options.map((i)=>i.item);
      this.statrows.append(new ModuleShortLinkListRow(s, arr, this.navigation_view));
    }

    if (this.data.proficiencies && this.data.proficiencies.length > 0) {
      hascontent = true;
      this.statrows.append(new ModuleLinkListRow(
        "Proficiencies",
        this.data.proficiencies.filter((i) => {
            return !i.url.includes("saving-throw")
          }).map((i) => {
            return get_sync(i.url).reference;
          } ),
        this.navigation_view));
    }

    if (this.data.language_options) {
      hascontent = true;
      this.statrows.append(new ModuleText(this.data.language_options.desc));
    }

    if (this.data.trait_specific) {
      // TODO
      if (this.data.trait_specific.damage_type) console.log("TODO trait_specific");
      else if (this.data.trait_specific.subtrait_options) {
        this.statrows.append(new ModuleLinkListRow(
          "choose " + this.data.trait_specific.subtrait_options.choose,
          this.data.trait_specific.subtrait_options.from.options.map((i) => {
            return i.item;
          }), this.navigation_view));
      } else if (this.data.trait_specific.spell_options) {
        this.statrows.append(new ModuleLinkListRow(
          "choose " + this.data.trait_specific.spell_options.choose,
          this.data.trait_specific.spell_options.from.options.map((i) => {
            return i.item;
          }), this.navigation_view));
      } else {
        this.statrows.append(new ModuleText(this.data.trait_specific.desc));
      }
      hascontent = true;
    }

    if (hascontent) this.wrapper.append(this.statrows);

    if (this.data.subraces.length > 0) {
      this.wrapper.append(new ModuleTitle("Subraces", 4));
      this.wrapper.append(new ModuleLinkList(this.data.subraces.map((i) => {
        return { item: i};
      } ), this.navigation_view));
    }

    if (this.data.races.length > 0) {
      this.wrapper.append(new ModuleTitle("Races", 4));
      this.wrapper.append(new ModuleLinkList(this.data.races.map((i) => {
        return { item: i};
      } ), this.navigation_view));
    }

  }
});

export const SearchResultPageWeaponProperty = GObject.registerClass({
  GTypeName: 'SearchResultPageWeaponProperty',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    this.wrapper.append(new ModuleMultiText(this.data.desc));
  }
});

