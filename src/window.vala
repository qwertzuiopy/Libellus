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

[GtkTemplate (ui = "/de/hummdudel/Libellus/welcome.ui")]
public class Libellus.Welcome : Adw.Dialog {
    [GtkChild]
    public unowned Gtk.Button import_button;
    Window window;
    public Welcome(Window window) {
        this.window = window;
        import_button.clicked.connect(() => {
            import.begin();
        });
    }
    public async void import() {
        var file_dialog = new Gtk.FileDialog ();
        File folder = yield file_dialog.select_folder (window, null);
        yield window.import(folder);
        this.force_close();
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/window.ui")]
public class Libellus.Window : Adw.ApplicationWindow {
    public File source_folder;
    public File data_folder;
    public File filter_file;
    File dir_file;
    public File bookmark_file;
    public Bookmarks bookmarks;

    ArrValue dir;
    public ArrValue filter_data;
    public ListStore liststore;
    public Gtk.SignalListItemFactory factory;

    public Config config;

    [GtkChild]
    public unowned Adw.TabView tabview;
    [GtkChild]
    public unowned Adw.TabOverview overview;

    public Window (Gtk.Application app, Config config) {
        Object (application: app);

        this.config = config;

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
            entry.title.label = ((StrValue)map["name"]).str;
            entry.subtitle.label = ((StrValue)map["category"]).str;
        });
        factory.unbind.connect((item) => {
            var list_item = (Gtk.ListItem) item;
            var entry = (SearchEntry) list_item.child;
            entry.title.label = "";
            entry.subtitle.label = "";
        });
        overview.view = tabview;

        var theme = Gtk.IconTheme.get_for_display (Gdk.Display.get_default ());
        theme.add_resource_path ("/de/hummdudel/Libellus/icons");



        var close_tab_shortcut = new Gtk.Shortcut(Gtk.ShortcutTrigger.parse_string("<Control>W"), new Gtk.NamedAction("win.close-tab"));
        var close_tab_action = new SimpleAction("close-tab", null);
        close_tab_action.activate.connect((_blub) => {
          if (tabview.get_n_pages() > 1) {
            tabview.close_page(tabview.selected_page);
          }
        });
        this.add_action(close_tab_action);

        var new_tab_action = new SimpleAction("new-tab", null);
        new_tab_action.activate.connect((_blub) => {
            this.new_tab();
        });
        var new_tab_shortcut = new Gtk.Shortcut(Gtk.ShortcutTrigger.parse_string("<Control>T"), Gtk.NothingAction.get());
        this.add_action(new_tab_action);

        var shortcut_controller = new Gtk.ShortcutController();
        shortcut_controller.add_shortcut(close_tab_shortcut);
        shortcut_controller.add_shortcut(new_tab_shortcut);
        // this.add_controller(shortcut_controller);

        if (this.config.get_sources().arr.size == 0) {
            var dialog = new Welcome(this);
            dialog.present(this);
        } else {
            load_source.begin(((StrValue)config.get_default().map["folder"]).str);
        }
    }

    public void new_tab() {
        tabview.append(new Tab(this));
    }
    public void open(string id) {
        var tab = new Tab(this);
        tab.navview.push(new Page(this.data_folder.get_child(id), this, tab));
        tabview.append(tab);
        tabview.selected_page = tabview.get_page(tab);
    }
    public MapValue? fetch_dir_for_id(string id) {
        foreach(var item in this.dir.arr) {
            if (((StrValue)((MapValue)item).map["id"]).str == id) {
                return (MapValue)item;
            }
        }
        message(@"could not find id '$id'");
        return null;
    }

    public async void load_source(string path) {
        try {
            File folder = File.new_for_path(path);
            this.source_folder = folder;
            this.data_folder = folder.get_child("data");
            this.dir_file = folder.get_child("dir");
            this.filter_file = folder.get_child("filter");
            this.bookmark_file = folder.get_child("bookmarks");
            this.bookmarks = new Bookmarks(this);

            uint8[] contents;
            string etag_out;
            this.dir_file.load_contents (null, out contents, out etag_out);
            this.dir = (ArrValue)Value.from_str((string) contents);

            this.filter_file.load_contents (null, out contents, out etag_out);
            this.filter_data = (ArrValue)Value.from_str((string) contents);

            foreach(var v in this.dir.arr) {
                this.liststore.append((MapValue)v);
            }
            while (tabview.get_n_pages() > 0) {
                tabview.close_page(tabview.get_nth_page(0));
            }
            Tab tab = new Tab(this);
            this.tabview.append(tab);
        } catch (Error e) {
            critical(e.message);
            message("oopsie");
        }
    }

    public async void import (File folder) {
        try {
            yield config.add_source(folder);
            yield load_source(folder.get_path());
        } catch (Error e) {
            critical (e.message);
        }
    }
    public void delete_source (MapValue v) {
        config.delete_source(v);
        if (source_folder.get_path() == ((StrValue) v.map["folder"]).str) {
            message(config.get_sources().to_str());
            if (config.get_sources().arr.size == 0) {
                var dialog = new Welcome(this);
                dialog.present(this);
            } else {
                load_source.begin(((StrValue)config.get_default().map["folder"]).str);
            }
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
    unowned Gtk.MenuButton menu_button;
    [GtkChild]
    unowned Gtk.Button sources_button;
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
        this.sources_button.clicked.connect(() => {
            var sources_menu = new SourcesDialog(this.window);
            sources_menu.present(this);
        });
        var menu = new Menu();
        menu.append_item(new MenuItem("Keyboard Shortcuts", "app.shortcuts"));
        menu.append_item(new MenuItem("About Libellus", "app.about"));
        this.menu_button.menu_model = menu;
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
    Tab tab;

    bool changing_bookmark = false;

    [GtkChild]
    unowned Adw.Clamp clamp;
    [GtkChild]
    unowned Gtk.ToggleButton bookmark_button;

    public Page (File file, Window window, Tab tab) {
        this.window = window;
        this.tab = tab;
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
            clamp.child = build_content(content, tab);
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
                } else {
                    this.window.bookmarks.remove_bookmark(((StrValue)this.data.map["id"]).str);
                    this.bookmark_button.css_classes = {};
                }
                this.changing_bookmark = false;
            });

        } catch (Error e) {
            critical (e.message);
        }
    }

    public static Gtk.Widget build_content(ArrValue content, Tab tab) {
        var box = new Gtk.Box(VERTICAL, 10) {
          margin_start = 12,
          margin_end = 12,
          margin_top = 12,
          margin_bottom = 24,
        };
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
                    w = new StatGridModule((MapValue)c, tab);
                    break;
                case "LinkList":
                    w = new LinkListModule((MapValue)c, tab);
                    break;
                case "MultiText":
                    w = new MultiTextModule((MapValue)c);
                    break;
                case "Table":
                    w = new TableModule((MapValue)c);
                    break;
                case "StatList":
                    w = new StatListModule((MapValue)c, tab);
                    break;
                case "TitledText":
                    w = new TitledTextModule((MapValue)c);
                    break;
                case "Image":
                    w = new ImageModule((MapValue)c);
                    break;
                case "Cycle":
                    w = new CycleModule((MapValue)c, tab);
                    break;
                default:
                    GLib.error(@"unrecongnised Module '$id'");
            }
            box.append(w);
        }
        return box;
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

