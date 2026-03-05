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
    File data_folder;
    File dir_file;
    ArrValue dir;
    public ListStore liststore;
    public Gtk.SignalListItemFactory factory;

    [GtkChild]
    public unowned Adw.TabView tabview;
    [GtkChild]
    public unowned Adw.TabOverview overview;

    public Window (Gtk.Application app) {
        Object (application: app);

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
        tabview.append(new Libellus.Tab(this));

        test.begin ();
    }
    public async void test () {
        var file_dialog = new Gtk.FileDialog ();

        try {
            File folder = yield file_dialog.select_folder (this, null);
            data_folder = folder.get_child("data");
            dir_file = folder.get_child("dir");
            uint8[] contents;
            string etag_out;
            dir_file.load_contents (null, out contents, out etag_out);
            dir = (ArrValue)Value.from_str((string) contents);
            foreach(var v in dir.arr) {
                liststore.append((MapValue)v);
            }
            Tab tab = new Tab(this);
            tab.navview.push(new SearchPage(this));
            tabview.append(tab);
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
    unowned Adw.TabButton overview_button;
    [GtkChild]
    unowned Adw.TabBar tabbar;
    [GtkChild]
    public unowned Adw.NavigationView navview;

    public Window window;

    public Tab(Window window) {
        this.window = window;
        overview_button.view = window.tabview;
        overview_button.clicked.connect(() => {
            this.window.overview.open = true;
        });
        tabbar.view = window.tabview;
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/page.ui")]
public class Libellus.Page : Adw.Bin {
    MapValue data;

    [GtkChild]
    unowned Gtk.Box box;

    public Page (File file) {
        try {
            uint8[] contents;
            string etag_out;
            file.load_contents (null, out contents, out etag_out);
            Value v = Value.from_str((string) contents);
            if (!(v is MapValue)) {
                GLib.error("expected toplevel node to be a map");
            }
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

                    default:
                        GLib.error(@"unrecongnised Module '$id'");
                        break;
                }
                box.append(w);
            }
            this.data = (MapValue) v;
        } catch (Error e) {
            critical (e.message);
        }
    }
}
