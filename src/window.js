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


import { resolve_link, get_search_results } from "./dnd.js";
import { ResultPage, SearchResult } from "./results.js";

import { FilterDialog } from "./filter.js";

export const Tab = GObject.registerClass({
  GTypeName: 'Tab',
}, class extends Adw.NavigationPage {
  constructor() {
    super({title: "Search"});
  }
});
import { SheetTab } from "./character_sheet.js";


import { API } from './api.js';
import { DBUS } from './dbus.js';

const use_local = true;

const Soup = imports.gi.Soup;
const Decoder = new TextDecoder();
const session = Soup.Session.new();

var window;

export const LibellusWindow = GObject.registerClass({
  GTypeName: 'LibellusWindow',
  Template: 'resource:///de/hummdudel/Libellus/window.ui',
  Children: [
    "overview",
    "toolbar_view",
    "header_bar",
    "tab_view",
    "bookmark_popover",
    "bottom_bar",
    "menu_button",

    "breakpoint",

    "bookmark_button",
    "tab_button",
    "new_tab" ,
    "back_button",
  ],
}, class LibellusWindow extends Adw.ApplicationWindow {
  constructor(application, main_window = false) {
    super({ application });
    this.main_window = main_window;

    const provider = new Gtk.CssProvider();
    provider.connect("parsing-error", (_provider, _section, error) => { log(error); });
    provider.load_from_string(".bookmark-row { padding: 0; } ");
    Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

    const builder = Gtk.Builder.new_from_resource("/de/hummdudel/Libellus/gtk/help-overlay.ui");
    this.set_help_overlay(builder.get_object("help_overlay"));

    const close_tab_shortcut = Gtk.Shortcut.new(Gtk.ShortcutTrigger.parse_string("<Control>w"), Gtk.NamedAction.new("win.close-tab"));
    const close_tab_action = new Gio.SimpleAction({ name: "close-tab" });
    close_tab_action.connect("activate", () => {
      if (this.tab_view.get_n_pages() > 1) {
        this.tab_view.close_page(this.tab_view.selected_page);
      }
    });
    this.add_action(close_tab_action);

    const new_tab_shortcut = Gtk.Shortcut.new(Gtk.ShortcutTrigger.parse_string("<Control>t"), Gtk.NamedAction.new("win.new-tab"));
    const new_tab_action = new Gio.SimpleAction({ name: "new-tab" });
    new_tab_action.connect("activate", () => {
      let tab = new SearchTab(new NavView());
      let tab_page = this.tab_view.append(tab.navigation_view);
      tab.navigation_view.tab_page = this.tab_view.get_nth_page(this.tab_view.n_pages-1);
      tab.navigation_view.window = this;
      this.tab_view.selected_page = tab_page;
    });
    this.add_action(new_tab_action);

    const bookmark_shortcut = Gtk.Shortcut.new(Gtk.ShortcutTrigger.parse_string("<Control>b"), Gtk.NamedAction.new("win.bookmark"));
    const bookmark_action = new Gio.SimpleAction({ name: "bookmark" });
    bookmark_action.connect("activate", () => {
      this.tab_view.selected_page.child.get_visible_page().child.bookmark_accel();
    });
    this.add_action(bookmark_action);

    const shortcut_controller = new Gtk.ShortcutController();
    shortcut_controller.add_shortcut(close_tab_shortcut);
    shortcut_controller.add_shortcut(new_tab_shortcut);
    shortcut_controller.add_shortcut(bookmark_shortcut);
    this.add_controller(shortcut_controller);

    if (main_window) {
      let dbus = new DBUS();
    }

    this.overview.connect("create-tab", () => {
      let tab = new SearchTab(new NavView());
      let tab_page = this.tab_view.append(tab.navigation_view);
      tab.navigation_view.tab_page = this.tab_view.get_nth_page(this.tab_view.n_pages-1);
      tab.navigation_view.window = this;
      this.tab_view.selected_page = tab_page;
      return tab_page;
    } );

    if (main_window) {
      this.tabs = [
        new SearchTab(new NavView()),
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

    this.new_tab.connect("clicked", () => {
      let tab = new SearchTab(new NavView());
      let tab_page = this.tab_view.append(tab.navigation_view);
      tab.navigation_view.tab_page = this.tab_view.get_nth_page(this.tab_view.n_pages-1);
      tab.navigation_view.window = this;
      this.tab_view.selected_page = tab_page;
    } );

    this.tab_button.connect("clicked", () => { this.overview.open = true; } );

    this.back_button.connect("clicked", () => { this.tab_view.selected_page.child.pop(); });

    this.menu = new Gio.Menu();
    this.menu.append_item(Gio.MenuItem.new("Keyboard Shortcuts", "win.show-help-overlay"));
    this.menu.append_item(Gio.MenuItem.new("About Libellus", "app.about"));

    this.menu_button.menu_model = this.menu;

    this.bookmark_list = new Gtk.ListBox();
    this.bookmark_list.connect("row-activated", (_, row) => {
      row.activated();
    });

    this.bookmark_popover.child = this.bookmark_list;

    this.breakpoint.connect("apply", () => {
      this.header_bar.remove(this.bookmark_button);
      this.header_bar.remove(this.back_button);
      this.header_bar.remove(this.tab_button);
      this.header_bar.remove(this.new_tab);
      this.bottom_bar.pack_start(this.back_button);
      this.bottom_bar.pack_start(this.new_tab);
      this.bottom_bar.pack_end(this.bookmark_button);
      this.bottom_bar.pack_end(this.tab_button);
    });
    this.breakpoint.connect("unapply", () => {
      this.bottom_bar.remove(this.bookmark_button);
      this.bottom_bar.remove(this.back_button);
      this.bottom_bar.remove(this.tab_button);
      this.bottom_bar.remove(this.new_tab);
      this.header_bar.pack_start(this.back_button);
      this.header_bar.pack_start(this.new_tab);
      this.header_bar.pack_end(this.bookmark_button);
      this.header_bar.pack_end(this.tab_button);
    });


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
  let tab = new SearchTab(new NavView());
  tab_view.append(tab.navigation_view);
  tab.navigation_view.tab_page = tab_view.get_nth_page(tab_view.n_pages-1);
  tab.navigation_view.tab_view = tab_view;
  tab_view.selected_page = tab_view.get_nth_page(tab_view.n_pages-1);
  navigate(data, tab.navigation_view);
  return tab;
}

const SearchTab = GObject.registerClass({
  GTypeName: 'SearchTab',
}, class extends Tab {
  constructor(navigation_view) {
    super({});
    setTimeout(() => { this.navigation_view.tab_page.set_title("Search"); }, 1);
    this.navigation_view = navigation_view;
    this.set_hexpand(true)

    this.bookmark_accel = () => {
    };


    this.key_controller = new Gtk.EventControllerKey();
    this.key_controller.connect("key-pressed", (_controller, val, _code, _state, _data) => {
      let name = Gdk.keyval_name(val);
      if (name.length > 1) return;
      this.entry.grab_focus();
      this.entry.text = this.entry.text + name;
      this.entry.set_position(this.entry.text.length);
    });
    this.add_controller(this.key_controller);

    this.update_title = () => {
      this.navigation_view.tab_page.set_title("Search");
    };

    this.navigation_view.push(this);

    this.scrolled_window = new Gtk.ScrolledWindow( { halign: Gtk.Align.FILL, hexpand: true, hscrollbar_policy: Gtk.PolicyType.NEVER } );
    this.scrolled_window.update_title = () => {
      this.navigation_view.tab_page.set_title("Search");
    }

    this.scrolled_window.add_css_class("undershoot-top");
    this.scrolled_window.add_css_class("undershoot-bottom");

    this.child = this.scrolled_window;

    this.wrapper = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    this.scrolled_window.set_child(this.wrapper);

    this.list_box = new Gtk.ListBox( {
      halign: Gtk.Align.CENTER,
      margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15,
      css_classes: ["boxed-list"],
      selection_mode: Gtk.SelectionMode.NONE
    } );
    this.wrapper.append(this.list_box);
    this.entry = new Adw.EntryRow( { title: "Search..." } );
    this.list_box.append(this.entry);

    this.filter_button = new Gtk.Button( { iconName: "funnel-symbolic" } );
    this.filter_dialog = new FilterDialog();
    this.filter_dialog.connect("applied", () => {
      this.active_filter = this.filter_dialog.filter;
      this.update_search();
      if (this.active_filter) {
        this.filter_button.add_css_class("accent");
      } else {
        this.filter_button.remove_css_class("accent");
      }
    });
    this.filter_button.connect("clicked", () => {
      this.filter_dialog.present(this);
    });
    this.filter_button.add_css_class("flat");
    this.filter_button.set_valign(Gtk.Align.CENTER);
    this.entry.add_suffix(this.filter_button);

    this.set_filter = (filter) => {
      this.active_filter = filter;
      this.filter_dialog.set_filter(filter);
      if (this.active_filter) {
        this.filter_button.add_css_class("accent");
      } else {
        this.filter_button.remove_css_class("accent");
      }
      this.update_search();
    }

    this.active_filter = null;
    this.search_term = "";
    this.update_search = () => {
      this.search_term = this.entry.get_text();
      for (let i = 0; i < this.results.length; i++) {
        if (this.search_term == "" || this.results[i].name.toLowerCase().includes(this.search_term.toLowerCase()) || this.search_term.toLowerCase().includes(this.results[i].name.toLowerCase())) {
          if (!this.active_filter || this.active_filter.func(this.results[i].data.url, this.active_filter)) {
            this.results[i].visible = true;
            continue;
          }
        }
        this.results[i].visible = false;
      }
    }
    this.entry.connect("changed", this.update_search);

    this.results = get_search_results([]);


    for (let i = 0; i < this.results.length; i++) {
      this.list_box.append(this.results[i]);
    }
    this.list_box.connect("row_activated", (_, i) => { navigate(i.data, this.navigation_view) } );

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
  if (data.filter) {
    page = new SearchTab(navigation_view);
    page.set_filter(unmake_manifest(data));
    return;
  }
  var page_data = get_sync(data.url);
  var page = resolve_link(data, navigation_view);
  if (page == null) {
    log("could not navigate to " + data.url);
  }

  navigation_view.push(new Adw.NavigationPage( { title: "no title", child: page } ));
  setTimeout(page.update_title, 10);
  log("navigated to " + data.url)
  return;
}


export const get_sync = (url) => {
  if (use_local) {
    let section = API[url.split("/")[2]]; // classes, spells, ...
    const key = url.split("/")[3]; // barbarian, fireball, ...
    if (!key) {
      return { results: Object.values(section) };
    }
    if (url.split("/")[4]) { // catches urls of type "/api/classes/levels" which need to go to API["levels"]
      section = API[url.split("/")[4]];
      return Object.values(section).filter((i) => i.url.includes(key));
    }
    return section[key];
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

    this.get_visible_page = () => {
      return this.child.visible_page;
    }
  }
});





export const filter_options = {
  Spells: {
    title: "Spells",
    choices: [
      { title: "School", content: ["Any"].concat(get_sync("/api/magic-schools").results.map((i) => { return i.name; } )), selected: "Any" },
      { title: "Level", min: 0, max: 9, value: 0, enabled: false },
      { title: "Classes", content: ["Any"].concat(get_sync("/api/classes").results.map((i) => { return i.name; } )), selected: "Any" },
    ],
    func: (url, o) => {
      if (!url.includes("spells")) return false;
      let data = get_sync(url);
      return (o.choices[0].selected == "Any" || o.choices[0].selected == data.school.name)
          && (o.choices[1].enabled == false  || o.choices[1].value == data.level)
          && (o.choices[2].selected == "Any" || data.classes.map((i) => i.name).indexOf(o.choices[2].selected) != -1);
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
      return (o.choices[0].selected == "Any" || data.races.map((i) => i.name).indexOf(o.choices[0].selected) != -1);
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
        o.choices[0].selected.includes(s) || s.includes(o.choices[0].selected);

      return (o.choices[0].selected == "Any" || o.choices[0].selected == data.equipment_category.name ||
        (data.gear_category && has(data.gear_category.name)) ||
        (data.vehicle_category && has(data.vehicle_category)) ||
        (data.armor_category && has(data.armor_category)) ||
        (data.weapon_category && has(data.weapon_category)) ||
        (data.weapon_range && has(data.weapon_range)) ||
        (data.tool_category && has(data.tool_category))) && (
        o.choices[1].selected == "Any" ||
        data.properties && data.properties.map((i) => i.name).includes(o.choices[1].selected))


    },
  },
  Monsters: {
    title: "Monsters",
    choices: [
      { title: "Challenge Rating", min: 0, max: 50, value: 0, enabled: false },
    ],
    func: (url, o) => {
      if (!url.includes("monsters")) return false;
      let data = get_sync(url);
      return o.choices[0].value == data.challenge_rating || o.choices[0].enabled == false;
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
        o.choices[1].selected.includes(s) || s.includes(o.choices[1].selected);
      let data = get_sync(url);
      return (o.choices[0].selected == "Any" ||
        o.choices[0].selected == data.rarity.name) && (
        o.choices[1].selected == "Any" ||
        data.equipment_category && has(data.equipment_category.name));
    },
  },
  Classes: {
    title: "Classes",
    choices: [],
    func: (url, o) => { return url.includes("classes"); },
  },
  Races: {
    title: "Races",
    choices: [],
    func: (url, o) => { return url.includes("races"); },
  },
};


export const make_filter = (filter) => {
  return { title: filter.title, func: filter.func, choices: JSON.parse(JSON.stringify(filter.choices)) };
}



// eg. "Items", ["Light Armor", "Any"]
export const make_manifest = (filter, settings) => {
  return { filter: filter, settings: settings };
}

export const unmake_manifest = (manifest) => {
  let filter = make_filter(filter_options[manifest.filter]);
  for (let i in manifest.settings) {
    filter.choices[i].selected = manifest.settings[i];
  }
  return filter;
}

