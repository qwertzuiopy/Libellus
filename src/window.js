/* window.js
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
import Gdk from 'gi://Gdk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';


import { SearchResult, SearchResultPageBundle, SearchResultPageSchool, SearchResultPageWeaponProperty, SearchResultPageArmor, SearchResultPageSpell, SearchResultPageMagicGear, SearchResultPageSkill, SearchResultPageTrait, SearchResultPageGear, SearchResultPageRace, SearchResultPageSubrace, SearchResultPageSubclass, SearchResultPageClass, SearchResultPageMonster, SearchResultPageFeature, SearchResultPageEquipmentCategory, SearchResultPageAbilityScore, SearchResultPageAlignment } from "./results.js";
import {} from "./modules.js";

export const Tab = GObject.registerClass({
  GTypeName: 'Tab',
}, class extends Adw.NavigationPage {
  constructor() {
    super({title: "no title"});
  }
});
import { SheetTab } from "./character_sheet.js";


import { API } from './api.js';
// import { API } from './api2.js';
import { DBUS } from './dbus.js';

const use_local = true;


const Soup = imports.gi.Soup;
const Decoder = new TextDecoder();
const session = Soup.Session.new();



var window;




export const LibellusWindow = GObject.registerClass({
  GTypeName: 'LibellusWindow',
  Template: 'resource:///io/github/qwertzuiopy/Libellus/window.ui',
}, class LibellusWindow extends Adw.ApplicationWindow {
  constructor(application, main_window = false) {
    super({ application });


    this.main_window = main_window;

    let provider = new Gtk.CssProvider();
    provider.connect("parsing-error", (_provider, _section, error) => { log(error); });
    provider.load_from_string(".bookmark-row { padding: 0; } ");
    Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    if (main_window) {
      let dbus = new DBUS();
    }

    this.overview = new Adw.TabOverview( { enable_new_tab: true } );
    this.overview.connect("create-tab", () => {
      let tab = new SearchTab({}, new NavView());
      this.tab_view.append(tab.navigation_view);
      tab.navigation_view.tab_page = this.tab_view.get_nth_page(this.tab_view.n_pages-1);
      tab.navigation_view.window = this;
      return this.tab_view.get_nth_page(this.tab_view.n_pages-1);
    } );

    this.content = this.overview;
    this.toolbar_view = new Adw.ToolbarView();
    this.overview.child = this.toolbar_view;

    this.tab_view = new Adw.TabView( {
      halign: Gtk.Align.FILL, valign: Gtk.Align.FILL,
      hexpand: true, vexpand: true } );
    if (main_window) {
      this.tabs = [
        new SearchTab({}, new NavView()),
      ];
    } else {
      this.tabs = [];
    }
    this.tab_view.connect("create-window", () => {
      let new_window = new LibellusWindow(application);
      new_window.present();
      return new_window.tab_view;
    });

    for (let i in this.tabs) {
      this.tab_view.append(this.tabs[i].navigation_view);
      this.tabs[i].navigation_view.tab_page = this.tab_view.get_nth_page(i);
      this.tabs[i].navigation_view.tab_view = this.tab_view;
      this.tabs[i].navigation_view.window = this;
    }
    this.active_tab = 0;
    this.tab_bar = new Adw.TabBar( { view: this.tab_view } );
    this.header_bar = new Adw.HeaderBar( {
      title_widget: new Gtk.Label( {
        label: "Libellus",
        css_classes: ["heading"] } ) } );

    this.new_tab = new Gtk.Button( { icon_name: "tab-new-symbolic" } );
    this.new_tab.connect("clicked", () => {
      let tab = new SearchTab({}, new NavView());
      this.tab_view.append(tab.navigation_view);
      tab.navigation_view.tab_page = this.tab_view.get_nth_page(this.tab_view.n_pages-1);
      tab.navigation_view.tab_view = this.tab_view;
    } );
    this.open_overview = new Gtk.Button( { icon_name: "view-grid-symbolic" } );
    this.open_overview.connect("clicked", () => { this.overview.open = true; } );
    this.overview.view = this.tab_view;
    this.header_bar.pack_start(this.new_tab);
    this.header_bar.pack_start(this.open_overview);

    this.menu = new Gio.Menu();
    // this.menu.append_item(Gio.MenuItem.new("Preferences", "app.settings"));
    this.menu.append_item(Gio.MenuItem.new("About Libellus", "app.about"));


    this.header_bar.pack_end(new Gtk.MenuButton( { icon_name: "open-menu-symbolic", menu_model: this.menu } ));

    this.bookmark_list = new Gtk.ListBox();
    this.bookmark_list.connect("row-activated", (_, row) => {
      row.activated();
    });
    this.bookmark_menu = new Gtk.MenuButton( { icon_name: "star-large-symbolic", popover: new Gtk.Popover( { css_classes: ["menu"], child: this.bookmark_list } ) } );
    this.header_bar.pack_end(this.bookmark_menu);

    this.toolbar_view.add_top_bar(this.header_bar);
    this.toolbar_view.add_top_bar(this.tab_bar);
    this.toolbar_view.set_content(this.tab_view);
    this.toolbar_view.top_bar_style = Adw.ToolbarStyle.RAISED;

    for (let i in filter_options) {
      filter_actions[i] = new Gio.SimpleAction({
        name: 'filter_' + i,
      });
      filter_actions[i].connect("activate", () => {
        this.tab_view.selected_page.child.visible_page.add_filter(i);
      });
      this.add_action(filter_actions[i]);
    }

    window = this;
    try {
      load_state();
    } catch {
      save_state();
    }


    update_boookmark_menu (this);
  }
});




export const BookmarkRow = GObject.registerClass({
  GTypeName: 'BookmarkRow',
}, class BookmarkRow extends Gtk.ListBoxRow {
  constructor(data) {
    super( { selectable: false, css_classes: ["bookmark-row"]} );
    this.data = data;

    this.child = new Gtk.Box( { spacing: 10 } );
    this.child.append(new Gtk.Label({ hexpand: true, label: data.name, margin_start: 8 } ));
    this.delete_button = new Gtk.Button( { halign: Gtk.Align.END, valign: Gtk.Align.CENTER, margin_top: 0, margin_bottom: 0, icon_name: "edit-clear-symbolic", css_classes: ["flat", "circular"] } );
    this.delete_button.connect("clicked", () => {
      toggle_bookmarked(this.data);
    } );
    this.child.append(this.delete_button);
    this.activated = () => {
      new_tab_from_data(this.data);
    }
  }
});


export const new_tab_from_data = (data) => {
  let tab_view = window.tab_view;
  let tab = new SearchTab({}, new NavView());
  tab_view.append(tab.navigation_view);
  tab.navigation_view.tab_page = tab_view.get_nth_page(tab_view.n_pages-1);
  tab.navigation_view.tab_view = tab_view;
  tab_view.selected_page = tab_view.get_nth_page(tab_view.n_pages-1);
  navigate(data, tab.navigation_view);
  return tab;
}




const Filter = GObject.registerClass({
  GTypeName: 'Filter',
}, class extends Adw.Bin {
  constructor(box, options) {
    super();
    this.box = box;
    this.options = options;

    if (this.options.choices.length > 0) {
      this.popover = new Gtk.Box( { orientation: Gtk.Orientation.VERTICAL, spacing: 5 } );
      for (let i in this.options.choices) {
        let box = new Gtk.Box( { spacing: 5, hexpand: true } );
        box.append(new Gtk.Label( { label:this.options.choices[i].title, hexpand: true } ));
        let dropdown;
        if (this.options.choices[i].content) {
          dropdown = Gtk.DropDown.new_from_strings(this.options.choices[i].content);
          if (this.options.choices[i].enable_search) {
            dropdown.enable_search = true;
            const expression = new Gtk.ClosureExpression(
              GObject.TYPE_STRING,
              (obj) => obj.string,
              null,
            );
            dropdown.expression = expression;
          }
          dropdown.connect("notify::selected", (d) => { this.options.choices[i].selected = this.options.choices[i].content[d.selected]; this.box.update_search(); });
        } else {
          dropdown = Gtk.SpinButton.new_with_range(this.options.choices[i].min, this.options.choices[i].max, 1);
          dropdown.connect("value-changed", (d) => { this.options.choices[i].value = d.value; this.box.update_search(); });
        }

        dropdown.halign = Gtk.Align.END;
        box.append(dropdown);
        this.popover.append(box);
      }

      this.button = new Adw.SplitButton( {
        label: options.title,
        valign: Gtk.Align.CENTER, halign: Gtk.Align.CENTER,
        popover: new Gtk.Popover( { child: this.popover } ) } );
    } else {
      this.button = new Gtk.Button( {
      label: options.title,
      valign: Gtk.Align.CENTER, halign: Gtk.Align.CENTER } );
    }
    this.child = this.button;
    this.button.connect('clicked', () => { this.box.remove_filter(this); });
  }

});


const SearchTab = GObject.registerClass({
  GTypeName: 'SearchTab',
}, class extends Tab {
  constructor(applied_filters, navigation_view) {
    super({});
    setTimeout(() => { this.navigation_view.tab_page.set_title("Search"); }, 1);
    this.navigation_view = navigation_view;
    this.set_hexpand(true)
    this.navigation_view.push(this);

    this.scrolled_window = new Gtk.ScrolledWindow();
    this.scrolled_window.set_halign(Gtk.Align.FILL);
    this.scrolled_window.set_hexpand(true);
    this.scrolled_window.set_size_request(400, 0);
    this.scrolled_window.update_title = () => {
      this.navigation_view.tab_page.set_title("Search");
    }

    this.scrolled_window.add_css_class("undershoot-top");
    this.scrolled_window.add_css_class("undershoot-bottom");

    this.child = this.scrolled_window;

    this.wrapper = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    this.scrolled_window.set_child(this.wrapper);

    this.list_box = new Gtk.ListBox();
    this.list_box.set_halign(Gtk.Align.CENTER);
    this.list_box.set_margin_top(15);
    this.list_box.set_margin_bottom(15);
    this.list_box.add_css_class("boxed-list")
    this.list_box.set_selection_mode(Gtk.SelectionMode.NONE);
    this.wrapper.append(this.list_box);
    this.entry = new Adw.EntryRow();
    this.entry.set_title("Search...");
    this.entry.set_size_request(380, 0);
    this.list_box.append(this.entry);

    this.filter_button = new Gtk.MenuButton({ iconName: "system-search-symbolic" });
    this.filter_menu = new Gio.Menu();
    for (let i in filter_options) {
      this.filter_menu.append(filter_options[i].title, "win.filter_" + i);
    }
    this.filter_button.set_menu_model(this.filter_menu);
    this.filter_button.add_css_class("flat");
    this.filter_button.set_valign(Gtk.Align.CENTER);
    this.entry.add_suffix(this.filter_button);

    this.filter_hider = new Gtk.Revealer();
    this.list_box.append(this.filter_hider);
    this.filter_row = new Adw.ActionRow();
    this.filters = [];
    for (let i in this.filters) {
      this.filter_row.add_prefix(this.filters[i]);
    }
    this.filter_hider.set_child(this.filter_row);
    // this.filter_hider.set_reveal_child(true);
    this.remove_filter = (filter) => {
      this.filter_row.remove(filter);
      this.filters.splice(this.filters.indexOf(filter), 1);
      if (this.filters.length <= 0) {
        this.filter_hider.set_reveal_child(false);
      }
      this.update_search();
    }
    this.add_filter = (index) => {
      var filter = new Filter(this, filter_options[index]);
      this.filters.push(filter);
      this.filter_row.add_prefix(filter);
      this.filter_hider.set_reveal_child(true);
      this.update_search();
    }

    this.search_term = "";
    this.update_search = () => {
      this.search_term = this.entry.get_text();
      for (let i = 0; i < this.results.length; i++) {
        if (this.search_term == "" || this.results[i].name.toLowerCase().includes(this.search_term.toLowerCase()) || this.search_term.toLowerCase().includes(this.results[i].name.toLowerCase())) {
          if (this.filters.length == 0) {
            this.results[i].visible = true;
            continue;
          }
          let found = false;
          for (let j = 0; j < this.filters.length; j++) {
            if (this.filters[j].options.func(this.results[i].data.url, this.filters[j])) found = true;
          }
          if (found) {
            this.results[i].visible = true;
            continue;
          }
        }
        this.results[i].visible = false;
      }
    }
    this.entry.connect("changed", this.update_search);

    this.results = [];
    this.results = this.results.concat(get_sync("/api/classes").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/subclasses").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/races").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/subraces").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/monsters").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/spells").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/equipment").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/magic-items").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/traits").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/alignments").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/skills").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/magic-schools").results.map((a) => new SearchResult(a)));
    this.results = this.results.concat(get_sync("/api/weapon-properties").results.map((a) => new SearchResult(a)));


    for (let i in this.results) {
      this.list_box.append(this.results[i]);
      this.results[i].connect("activated", () => { this.open_result(i); });
    }

    this.open_result = (i) => {
      navigate(this.results[i].data, this.navigation_view);
    }
    this.close_result = () => {
      this.navigation_view.navigate(Adw.NavigationDirection.BACK);
      setTimeout(() => { this.navigation_view.remove(this.open_result_page); this.open_result_page = null; }, 100);
    }


  }
});



export const score_to_modifier = (score) => {
  let table = {"1": "-5",
    "2": "-4", "3": "-4",
    "4": "-3", "5": "-3",
    "6": "-2", "7": "-2",
    "8": "-1", "9": "-1",
    "10": "0", "11": "0",
    "12": "+1", "13": "+1",
    "14": "+2", "15": "+2",
    "16": "+3", "17": "+3",
    "18": "+4", "19": "+4",
    "20": "+5", "21": "+5",
    "22": "+6", "23": "+6",
    "24": "+7", "25": "+7",
    "26": "+8", "27": "+8",
    "28": "+9", "29": "+9",
    "30": "+10"};
  return table[score];
}

export const navigate = (data, navigation_view) => {
  var page_data = get_sync(data.url);
  var page = null;
  if (page_data.armor_category) {
    page = new SearchResultPageArmor(page_data, navigation_view);
  } else if (page_data.url.includes("equipment") && !page_data.contents && !page_data.url.includes("equipment-categories")) {
    page = new SearchResultPageGear(page_data, navigation_view);
  } else if (page_data.components) {
    page = new SearchResultPageSpell(page_data, navigation_view);
  } else if (page_data.contents && page_data.contents.length > 0) {
    page = new SearchResultPageBundle(page_data, navigation_view);
  } else if (page_data.url.includes("magic-schools")) {
    page = new SearchResultPageSchool(page_data, navigation_view);
  } else if (page_data.url.includes("monsters")) {
    page = new SearchResultPageMonster(page_data, navigation_view);
  } else if (page_data.url.includes("alignments")) {
    page = new SearchResultPageAlignment(page_data, navigation_view);
  } else if (page_data.url.includes("magic-items")) {
    page = new SearchResultPageMagicGear(page_data, navigation_view);
  } else if (page_data.url.includes("classes") && !page_data.url.includes("subclasses")) {
    page = new SearchResultPageClass(page_data, navigation_view);
  } else if (page_data.url.includes("skills")) {
    page = new SearchResultPageSkill(page_data, navigation_view);
  } else if (page_data.url.includes("ability-scores")) {
    page = new SearchResultPageAbilityScore(page_data, navigation_view);
  } else if (page_data.url.includes("features")) {
    page = new SearchResultPageFeature(page_data, navigation_view);
  } else if (page_data.url.includes("equipment-categories")) {
    page = new SearchResultPageEquipmentCategory(page_data, navigation_view);
  } else if (page_data.url.includes("subclasses")) {
    page = new SearchResultPageSubclass(page_data, navigation_view);
  } else if (page_data.url.includes("subraces")) {
    page = new SearchResultPageSubrace(page_data, navigation_view);
  } else if (page_data.url.includes("races")) {
    page = new SearchResultPageRace(page_data, navigation_view);
  } else if (page_data.url.includes("traits")) {
    page = new SearchResultPageTrait(page_data, navigation_view);
  } else if (page_data.url.includes("weapon-properties")) {
    page = new SearchResultPageWeaponProperty(page_data, navigation_view);
  }

  navigation_view.push(new Adw.NavigationPage( { title: "no title", child: page } ));
  log("navigated to " + data.url)
  return;
}



export const get_sync = (url) => {
  if (use_local) {
    let sub = url.split("/")[2];
    sub = sub.split("-").join("_");
    let array = API[sub];
    let key = url.split("/")[3];
    if (!key) {
      return { results: array };
    }
    if (url.split("/")[4]) {
      array = API[url.split("/")[4]];
      return array.filter((i) => i.url.includes(key));
    }
    let index = array.map((i) => i.index).indexOf(key);
    return array[index];
  } else {
    let msg = Soup.Message.new('GET', 'https://www.dnd5eapi.co' + url);

    let s = session.send_and_read(msg, Gio.Cancellable.new()).get_data();
    return JSON.parse(Decoder.decode(s));
  }
}

export const get_any_sync = (url) => {
  let msg = Soup.Message.new('GET', 'https://www.dnd5eapi.co' + url);
  return session.send_and_read(msg, Gio.Cancellable.new()).get_data();

}


export const get_any_async = (url, callback) => {
  let msg = Soup.Message.new('GET', 'https://www.dnd5eapi.co' + url);
  session.send_and_read_async(msg, 1, Gio.Cancellable.new(), (a, b, c) => { callback(session.send_and_read_finish(b).get_data()); });
}


function read_sync(path) {
  const file = Gio.File.new_for_path(path);

  const [contents, etag] = file.load_contents(null);

  const decoder = new TextDecoder('utf-8');
  const contentsString = decoder.decode(contents);
  return contentsString;
}







export var bookmarks = [ { url: "/api/monsters/aboleth", name: "Aboleth" } ];

function update_boookmark_menu() {
  window.bookmark_list.remove_all();
  for (let i = 0; i < bookmarks.length; i++) {
    window.bookmark_list.append(new BookmarkRow(bookmarks[i]));
  }
}

export function is_bookmarked(data) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].url == data.url) {
      return true;
    }
  }
  return false;
}
export function toggle_bookmarked(data, bookmarked) {
  for (let i = 0; i < bookmarks.length; i++) {
    if (bookmarks[i].url == data.url) {
      bookmarks.splice(i, 1);
      save_state();
      update_boookmark_menu();
      return false;
    }
  }
  bookmarks.push(data);
  save_state();
  update_boookmark_menu();
  return true;
}



export function save_state() {
  let data = {
    bookmarks: bookmarks,
  };
  let dataJSON = JSON.stringify(data);
  let dataDir = GLib.get_user_config_dir();
  let destination = GLib.build_filenamev([dataDir, 'libellus_state.json']);
  let file = Gio.File.new_for_path(destination);
  let [success, tag] = file.replace_contents(dataJSON, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
  if(success) log("saved state");
  else log("error saving state");
}

function load_state() {
  let dataDir = GLib.get_user_config_dir();
  let destination = GLib.build_filenamev([dataDir, 'libellus_state.json']);
  let file = Gio.File.new_for_path(destination);

  const [ok, contents, etag] = file.load_contents(null);
  const decoder = new TextDecoder();
  const contentsString = decoder.decode(contents);
  let data = JSON.parse(contentsString);
  bookmarks = data.bookmarks;
  log("loaded state");
}

const filter_actions = [];
const filter_options = {
  Spells: {
    title: "Spells",
    choices: [
      { title: "School", content: ["Any"].concat(get_sync("/api/magic-schools").results.map((i) => { return i.name; } )), selected: "Any" },
      { title: "Level", content: ["Any", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], selected: "Any" },
      { title: "Classes", content: ["Any"].concat(get_sync("/api/classes").results.map((i) => { return i.name; } )), selected: "Any" },
    ],
    func: (url, o) => {
      if (!url.includes("spells")) return false;
      let data = get_sync(url);
      return (o.options.choices[0].selected == "Any" || o.options.choices[0].selected == data.school.name)
          && (o.options.choices[1].selected == "Any" || o.options.choices[1].selected == data.level.toString())
          && (o.options.choices[2].selected == "Any" || data.classes.map((i) => i.name).indexOf(o.options.choices[2].selected) != -1);
    },
  },
  Traits: {
    title: "Traits",
    choices: [
      { title: "Classes", content: ["Any"].concat(get_sync("/api/races").results.map((i) => { return i.name; } )), selected: "Any" },
    ],
    func: (url, o) => {
      if (!url.includes("traits")) return false;
      let data = get_sync(url);
      return (o.options.choices[0].selected == "Any" || data.races.map((i) => i.name).indexOf(o.options.choices[0].selected) != -1);
    },
  },
  Items: {
    title: "Equipment",
    choices: [
      { title: "Categories", content: ["Any"].concat(get_sync("/api/equipment-categories").results
        .map((i) => { return i.name; } ))
        .filter((i) => i != "Land Vehicles" &&
          i != "Wondrous Items" &&
          i != "Rod" &&
          i != "Potion" &&
          i != "Ring" &&
          i != "Scroll" &&
          i != "Staff" &&
          i != "Wand"), selected: "Any", enable_search: true },
      { title: "Properties", content: ["Any"].concat(get_sync("/api/weapon-properties").results.map((i) => { return i.name; } )), selected: "Any", enable_search: true },
    ],
    func: (url, o) => {
      if (!url.includes("equipment")) return false;
      let data = get_sync(url);

      let has = (s) =>
        o.options.choices[0].selected.includes(s) || s.includes(o.options.choices[0].selected);

      return (o.options.choices[0].selected == "Any" || o.options.choices[0].selected == data.equipment_category.name ||
        (data.gear_category && has(data.gear_category.name)) ||
        (data.vehicle_category && has(data.vehicle_category)) ||
        (data.armor_category && has(data.armor_category)) ||
        (data.weapon_category && has(data.weapon_category)) ||
        (data.weapon_range && has(data.weapon_range)) ||
        (data.tool_category && has(data.tool_category))) && (
        o.options.choices[1].selected == "Any" ||
        data.properties && data.properties.map((i) => i.name).includes(o.options.choices[1].selected))


    },
  },
  Monsters: {
    title: "Monsters",
    choices: [
      { title: "Challenge Rating", min: 0, max: 50, value: 0 },
    ],
    func: (url, o) => {
      if (!url.includes("monsters")) return false;
      let data = get_sync(url);
      return o.options.choices[0].value == data.challenge_rating;
    },
  },
  MagicItems: {
    title: "Magic Items",
    choices: [
      { title: "Rarity", content: ["Any", "Varies", "Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Artifact"], selected: "Any" },
      { title: "Type", content: ["Any", "Wondrous Item", "Rod", "Potion", "Ring", "Scroll", "Staff", "Wand"], selected: "Any" }
    ],
    func: (url, o) => {
      if (!url.includes("magic-items")) return false;
      let has = (s) =>
        o.options.choices[1].selected.includes(s) || s.includes(o.options.choices[1].selected);
      let data = get_sync(url);
      return (o.options.choices[0].selected == "Any" ||
        o.options.choices[0].selected == data.rarity.name) && (
        o.options.choices[1].selected == "Any" ||
        data.equipment_category && has(data.equipment_category.name));
    },
  },
  Classes: {
    title: "Classes",
    choices: [],
    func: (url, o) => { return url.includes("classes"); },
  },

};




export const NavView = GObject.registerClass({
  GTypeName: 'NavView',
}, class NavView extends Adw.Bin {
  constructor() {
    super({});
    this.child = new Adw.NavigationView({});

    this.pop = () => {
      this.child.pop();
      this.update_title();
    };

    this.update_title = () => {
      let page = this.child.visible_page.child;
      page.update_title();
    };
    this.child.connect("popped", this.update_title);

    this.push = (page) => {
      this.child.push(page);
    };
  }
});
