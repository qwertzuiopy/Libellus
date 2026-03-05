/* window.vala
 *
 * Copyright 2025 luna
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
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

[GtkTemplate (ui = "/de/hummdudel/Libellus/window.ui")]
public class Libellus.Window : Adw.ApplicationWindow {
    public File data_folder;
    File dir_file;
    public File bookmark_file;
    public Bookmarks bookmarks;

    ArrValue dir;
    public ListStore liststore;
    public Gtk.SignalListItemFactory factory;

    [GtkChild]
    public unowned Adw.TabView tabview;
    [GtkChild]
    public unowned Adw.TabOverview overview;

    public Window (Gtk.Application app) {
        Object (application: app);

        var provider = new Gtk.CssProvider();
        provider.load_from_string(".bookmark { padding: 0px 0px 0px 0px; margin: 0px 0px 0px 0px; }");
        Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), provider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        liststore = new ListStore(typeof(MapValue));
        factory = new Gtk.SignalListItemFactory();
        factory.setup.connect((item) => {
            var list_item = (Gtk.ListItem) item;
            list_item.child = new SearchEntry();
        });
        factory.bind.connect ((item) => {
            var list_item = (Gtk.ListItem) item;
            var entry = (SearchEntry) list_item.child;
            var map = ((MapValue) list_item.item).map;
            entry.label.label = ((StrValue)map["name"]).str;
        });

        overview.view = tabview;
        // tabview.append(new Libellus.Tab(this));



        test.begin ();
    }

    public void new_tab() {
        tabview.append(new Tab(this));
    }
    public void open(string id) {
        var tab = new Tab(this);
        tab.navview.push(new Page(this.data_folder.get_child(id), this));
        tabview.append(tab);
        tabview.selected_page = tabview.get_page(tab);
    }

    public async void test () {
        var file_dialog = new Gtk.FileDialog ();

        try {
            File folder = yield file_dialog.select_folder (this, null);
            this.data_folder = folder.get_child("data");
            this.dir_file = folder.get_child("dir");
            this.bookmark_file = folder.get_child("bookmarks");
            this.bookmarks = new Bookmarks(this);

            uint8[] contents;
            string etag_out;
            this.dir_file.load_contents (null, out contents, out etag_out);
            this.dir = (ArrValue)Value.from_str((string) contents);
            foreach(var v in this.dir.arr) {
                this.liststore.append((MapValue)v);
            }
            Tab tab = new Tab(this);
            this.tabview.append(tab);
        } catch (Error e) {
            critical (e.message);
        }
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/tab.ui")]
public class Libellus.Tab : Adw.Bin {
    [GtkChild]
    unowned Gtk.Button new_tab_button;
    [GtkChild]
    unowned Gtk.Button back_button;
    [GtkChild]
    unowned Adw.TabButton overview_button;
    [GtkChild]
    unowned Gtk.MenuButton bookmark_button;
    [GtkChild]
    unowned Adw.TabBar tabbar;
    [GtkChild]
    public unowned Adw.NavigationView navview;

    public Window window;

    public Tab(Window window) {
        this.window = window;
        this.overview_button.view = this.window.tabview;
        this.overview_button.clicked.connect(() => {
            this.window.overview.open = true;
        });
        this.new_tab_button.clicked.connect(() => {
            this.window.new_tab();
        });
        this.back_button.clicked.connect(() => {
            this.navview.pop();
        });
        this.tabbar.view = this.window.tabview;

        this.navview.push(new SearchPage(this.window, this));
        this.update_title.begin();
        this.navview.popped.connect(() => {
            this.update_title.begin();
        });
        this.bookmark_button.popover = new BookmarkMenu(this.window);
    }

    public async void update_title() {
        yield nap(10);
        this.window.tabview.get_page(this).title = this.navview.get_visible_page().title;
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/page.ui")]
public class Libellus.Page : Adw.NavigationPage {
    MapValue data;
    Window window;

    bool changing_bookmark = false;

    [GtkChild]
    unowned Gtk.Box box;
    [GtkChild]
    unowned Gtk.ToggleButton bookmark_button;

    public Page (File file, Window window) {
        this.window = window;
        try {
            uint8[] contents;
            string etag_out;
            file.load_contents (null, out contents, out etag_out);
            Value v = Value.from_str((string) contents);
            if (!(v is MapValue)) {
                GLib.error("expected toplevel node to be a map");
            }
            this.title = ((StrValue)((MapValue)v).map["name"]).str;
            ArrValue content = (ArrValue) ((MapValue)v).map["content"];
            foreach (var c in content.arr) {
                Gtk.Widget w;
                string id = ((StrValue)((MapValue)c).map["id"]).str;
                switch (id) {
                    case "Title":
                        w = new TitleModule((MapValue)c);
                        break;
                    case "Subtitle":
                        w = new SubtitleModule((MapValue)c);
                        break;
                    case "StatGrid":
                        w = new StatGridModule((MapValue)c);
                        break;
                    case "MultiText":
                        w = new MultiTextModule((MapValue)c);
                        break;
                    case "Table":
                        w = new TableModule((MapValue)c);
                        break;
                    case "StatList":
                        w = new StatListModule((MapValue)c);
                        break;
                    case "TitledText":
                        w = new TitledTextModule((MapValue)c);
                        break;
                    case "Image":
                        w = new ImageModule((MapValue)c);
                        break;

                    default:
                        GLib.error(@"unrecongnised Module '$id'");
                }
                box.append(w);
            }
            this.data = (MapValue) v;

            if (this.window.bookmarks.is_bookmarked(((StrValue)this.data.map["id"]).str)) {
                this.bookmark_button.active = true;
                this.bookmark_button.css_classes = {"accent"};
            } else {
                this.bookmark_button.active = false;
                this.bookmark_button.css_classes = {};
            }

            this.window.bookmarks.changed.connect(() => {
                if (this.changing_bookmark) {
                    return;
                }
                if (this.window.bookmarks.is_bookmarked(((StrValue)this.data.map["id"]).str)) {
                    this.bookmark_button.active = true;
                    this.bookmark_button.css_classes = {"accent"};
                } else {
                    this.bookmark_button.active = false;
                    this.bookmark_button.css_classes = {};
                }
            });

            this.bookmark_button.toggled.connect(() => {
                this.changing_bookmark = true;
                if (this.bookmark_button.active) {
                    var bookmark_data = new MapValue();
                    bookmark_data.map["name"] = this.data.map["name"];
                    bookmark_data.map["id"] = this.data.map["id"];
                    this.window.bookmarks.bookmarks.arr.add(bookmark_data);
                    this.window.bookmarks.changed();
                    this.bookmark_button.css_classes = {"accent"};
                    message("added");
                } else {
                    this.window.bookmarks.remove_bookmark(((StrValue)this.data.map["id"]).str);
                    message("removed");
                    this.bookmark_button.css_classes = {};
                }
                this.changing_bookmark = false;
            });
        } catch (Error e) {
            critical (e.message);
        }
    }
}





// see https://wiki.gnome.org/Projects/Vala/AsyncSamples
public async void nap (uint interval, int priority = GLib.Priority.DEFAULT) {
  GLib.Timeout.add (interval, () => {
      nap.callback ();
      return false;
    }, priority);
  yield;
}
