import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { filter_options, get_sync } from './window.js';

export const FilterDialog = GObject.registerClass({
  GTypeName: 'FilterDialog',
  Template: 'resource:///de/hummdudel/Libellus/filter_dialog.ui',
  Children: ["view"],
  Signals: {
    "applied": {},
  },
}, class extends Adw.Dialog {
  constructor() {
    super({});

    this.filter = null;
  }

  filter_spells() {
    this.push_filter(filter_options.Spells);
  }
  filter_traits() {
    this.push_filter(filter_options.Traits);
  }
  filter_equipment() {
    this.push_filter(filter_options.Items);
  }
  filter_monsters() {
    this.push_filter(filter_options.Monsters);
  }
  filter_magic_items() {
    this.push_filter(filter_options.MagicItems);
  }
  filter_classes() {
    this.filter = filter_options.Classes;
    this.emit("applied");
    this.close();
  }

  filter_none() {
    this.filter = null;
    this.emit("applied");
    this.close();
  }

  push_filter(filter) {
    let page = new FilterPage(filter);
    page.connect("applied", () => {
      this.filter = page.filter;
      this.emit("applied");
      this.close();
    });
    this.view.push(page);
  }
});



export const FilterRow = GObject.registerClass({
  GTypeName: 'FilterRow',
  Template: 'resource:///de/hummdudel/Libellus/filter_row.ui',
}, class extends Adw.ActionRow {
  constructor() {
    super({});
  }
});





export const FilterPage = GObject.registerClass({
  GTypeName: 'FilterPage',
  Template: 'resource:///de/hummdudel/Libellus/filter_page.ui',
  Children: ["list_box"],
  Signals: {
    "applied": {},
  },
}, class extends Adw.NavigationPage {
  constructor(filter) {
    super( { title: filter.title } );

    this.filter = filter;

    if (filter.choices.length == 0) {
      this.list_box.visible = false;
    }

    for (let i in filter.choices) {
      let row;
      if (filter.choices[i].content) {
        row = new Adw.ComboRow();
        row.model = Gtk.StringList.new(filter.choices[i].content);
        row.connect("notify::selected", () => {
          filter.choices[i].selected = filter.choices[i].content[row.selected];
        });
        if (filter.choices[i].enable_search) {
          row.enable_search = true;
        }
      } else {
        row = new Adw.ActionRow();
        let spin_button = Gtk.SpinButton.new_with_range(filter.choices[i].min, filter.choices[i].max, 1);
        spin_button.valign = Gtk.Align.CENTER;
        spin_button.sensitive = false;
        let switch_button = new Gtk.Switch( { valign: Gtk.Align.CENTER } );
        switch_button.connect("state-set", () => {
          spin_button.sensitive = !switch_button.state;
          filter.choices[i].enabled = !switch_button.state;
        });
        spin_button.connect("notify::value", () => {
          filter.choices[i].value = spin_button.value;
        });
        row.add_suffix(switch_button);
        row.add_suffix(spin_button);
      }
      row.title = filter.choices[i].title;
      this.list_box.append(row);
    }
  }

  apply() {
    this.emit("applied");
  }
});
