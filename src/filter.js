import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Adw from 'gi://Adw';
import { make_filter, adapter } from './window.js';

export const FilterDialog = GObject.registerClass({
  GTypeName: 'FilterDialog',
  Template: 'resource:///de/hummdudel/Libellus/filter_dialog.ui',
  Children: ["view", "filters"],
  Signals: {
    "applied": {},
  },
}, class extends Adw.Dialog {
  constructor(filters) {
    super({});

    for (let i in filters) {
      const row = new FilterRow(filters[i].title);
      row.connect("activated", () => {
        if (filters[i].choices.length == 0) {
          this.filter = filters[i];
          this.emit("applied");
          this.close();
        } else {
          this.push_filter(filters[i]);
        }
      });
      this.filters.append(row);
    }

    this.filter = null;
  }

  set_filter(filter) {
    while (this.view.get_previous_page(this.view.get_visible_page())) {
      this.view.pop();
    }
    this.push_filter(filter);
  }

  filter_none() {
    this.filter = null;
    this.emit("applied");
    this.close();
  }

  push_filter(filter) {
    let page = new FilterPage(make_filter(filter));
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
  constructor(title) {
    super( { title: title } );
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
        row.selected = filter.choices[i].content.indexOf(filter.choices[i].selected);
        row.connect("notify::selected", () => {
          filter.choices[i].selected = filter.choices[i].content[row.selected];
        });
        if (filter.choices[i].enable_search) {
          row.enable_search = true;
        }
      } else {
        row = new Adw.SpinRow();
        let adjustment = Gtk.Adjustment.new(filter.choices[i].value, filter.choices[i].min, filter.choices[i].max, 1, 0, 0);
        if (filter.choices[i].enabled) {
          row.adjustment = adjustment;
        } else {
          row.adjustment = null;
        }
        let switch_button = new Gtk.Switch( { valign: Gtk.Align.CENTER } );
        switch_button.active = filter.choices[i].enabled;
        switch_button.connect("notify::active", () => {
          if (switch_button.active) {
            filter.choices[i].enabled = true;
            row.adjustment = adjustment;
          } else {
            filter.choices[i].enabled = false;
            row.adjustment = null;
          }
        });
        row.connect("notify::value", () => {
          filter.choices[i].value = row.value;
        });
        row.add_suffix(switch_button);
      }
      row.title = filter.choices[i].title;
      this.list_box.append(row);
    }
  }

  apply() {
    this.emit("applied");
  }
});
