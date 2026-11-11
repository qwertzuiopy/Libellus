class Libellus.LinkButton : Gtk.Button {
    public LinkButton(string id, Tab tab) {
        var owned_id = id;
        this.valign = CENTER;
        this.add_css_class("accent");
        if (owned_id.has_prefix("@")) {
            owned_id = owned_id.substring(1, owned_id.length-1);
        }
        var data = tab.window.fetch_dir_for_id(owned_id);
        if (data == null) {
            this.label = "[NOT FOUND]"+owned_id;
        } else {
            this.label = data.map["name"].as_str();
        }
        this.clicked.connect(() => {
            tab.navview.push(new Page(tab.window.data_folder.get_child(owned_id), tab.window, tab));
        });
    }
}

class Libellus.LinkListModule : Adw.Bin {
    public LinkListModule (MapValue data, Tab tab) {
        var box = new Gtk.ListBox () {
            css_classes = {"boxed-list"},
            selection_mode = NONE,
        };
        foreach (var row in data.map["content"].as_arr()) {
            var str = row.as_map()["id"].as_str();
            if (str.has_prefix("@")) {
                str = str.substring(1, str.length-1);
            }
            var map = tab.window.fetch_dir_for_id(str);
            var title = "";
            if (map != null) {
                title = map.map["name"].as_str();
            }
            var item = new Adw.ActionRow() {
                title = title,
                subtitle = row.as_map()["content"].as_str(),
                activatable = true,
            };
            item.add_suffix(new Gtk.Image.from_icon_name("go-next-symbolic"));
            item.activated.connect(() => {
                tab.navview.push(new Page(tab.window.data_folder.get_child(str), tab.window, tab));
            });
            box.append(item);
        }
        this.child = box;
    }
}

class Libellus.ImageModule : Adw.Bin {
    public ImageModule (MapValue data) {
        this.height_request = 300;
        this.hexpand = true;
        this.child = new Adw.Spinner();
        load.begin(data);
    }
    async void load(MapValue data) {
        var url = data.map["url"].as_str();
        var message = new Soup.Message("GET", url);
        var session = new Soup.Session();
        try {
        var bytes = yield session.send_and_read_async(message, 1, null);
        var texture = Gdk.Texture.from_bytes(bytes);
        var picture = new Gtk.Picture() {
            paintable = texture,
            css_classes = {"card"},
            halign = CENTER,
        };
        this.child = picture;
        } catch (Error e) {
            critical (e.message);
        }
    }
}

class Libellus.TitledTextModule : Adw.Bin {
    public TitledTextModule (MapValue data) {
        var listbox = new Gtk.ListBox() {
            selection_mode = NONE,
            css_classes = {"boxed-list"},
        };
        var arr = (ArrValue)data.map["content"];
        foreach (var row in arr.arr) {
            var box = new Gtk.Box(VERTICAL, 6);
            var title = row.as_map()["title"].as_str();
            box.append(new Gtk.Label(title) {
                css_classes = {"heading"},
                margin_top = 6,
            });
            var content = row.as_map()["content"].as_str();
            box.append(new Gtk.Label(content) {
                margin_start = 12,
                margin_end = 12,
                margin_bottom = 6,
                wrap = true,
                justify = FILL,
            });
            listbox.append(new Gtk.ListBoxRow() { child = box, activatable = false });
        }
        this.child = listbox;
    }
}

class Libellus.StatListModule : Adw.Bin {
    public StatListModule (MapValue data, Tab tab) {
        var listbox = new Gtk.ListBox() {
            selection_mode = NONE,
            css_classes = {"boxed-list"},
        };
        foreach (var row in data.map["content"].as_arr()) {
            var box = new Gtk.Box(HORIZONTAL, 6) {
                margin_end = 6,
            };
            var title = row.as_map()["title"].as_str();
            var title_label = new Gtk.Label(title) {
                css_classes = {"heading"},
                margin_top = 12,
                margin_bottom = 12,
                margin_start = 12,
                hexpand = true,
                halign = START,
            };
            box.append(title_label);
            var wrap = new Adw.WrapBox() {
                child_spacing = 10,
                align = 1
            };
            // box.append(new Gtk.Separator(VERTICAL));
            var entries = row.as_map()["content"].as_arr();
            if (entries.size > 10) {
                box.orientation = VERTICAL;
                box.margin_start = 10;
                box.margin_end = 10;
                title_label.halign = CENTER;
                title_label.margin_bottom = 5;
            }
            foreach (var entry in entries) {
                var str = entry.as_str();
                if (str.has_prefix("@")) {
                    wrap.append(new LinkButton(str, tab){ margin_top = 6, margin_bottom = 6, margin_end = 0 });
                } else {
                    wrap.append(new Gtk.Label(str) { margin_top = 12, margin_bottom = 12, margin_end = 6, wrap = true } );
                }
            }

            box.append(wrap);
            listbox.append(new Gtk.ListBoxRow() {
                child = box,
                activatable = false,
            });
        }
        this.child = listbox;
    }
}
class Libellus.TitleModule : Adw.Bin {
    public TitleModule (MapValue data) {
        var label = new Gtk.Label(data.map["content"].as_str());
        label.add_css_class("title-1");
        label.margin_top = 10;
        label.margin_bottom = 10;
        label.justify = CENTER;
        label.wrap = true;
        this.child = label;
    }
}
class Libellus.TitleModuleEdit : Adw.Bin {
    public TitleModuleEdit (MapValue data) {
        var entry = new Gtk.Entry() {
            text = data.map["content"].as_str(),
            margin_top = 10,
            margin_bottom = 10,
            hexpand = true,
            halign = FILL,
            css_classes = {"title-1"},
        };
        this.child = entry;
    }
}
class Libellus.SubtitleModule : Adw.Bin {
    public SubtitleModule (MapValue data) {
        var label = new Gtk.Label(data.map["content"].as_str());
        label.add_css_class("title-3");
        label.margin_top = 10;
        label.margin_bottom = 10;
        this.child = label;
    }
}
class Libellus.SubtitleModuleEdit : Adw.Bin {
    public SubtitleModuleEdit (MapValue data) {
        var entry = new Gtk.Entry() {
            text = data.map["content"].as_str(),
            margin_top = 10,
            margin_bottom = 10,
            hexpand = true,
            halign = FILL,
            css_classes = {"title-3"},
        };
        this.child = entry;
    }
}
class Libellus.MultiTextModule : Adw.Bin {
    public MultiTextModule (MapValue data) {
        var box = new Gtk.ListBox();
        box.add_css_class("boxed-list");
        box.selection_mode = Gtk.SelectionMode.NONE;
        foreach (var v in data.map["content"].as_arr()) {
            var text = v.as_str();
            if (text.has_prefix("|---")) {
                continue;
            }
            var row = new Gtk.ListBoxRow() {
                activatable = false,
            };
            // if (text.has_prefix("|") && text.has_suffix("|")) {
            //     var tmp = new Gtk.Box(HORIZONTAL, 0);
            //     var sections = text.split("|");
            //     for (int i = 1; i < sections.length-1; i++) {
            //         var label = new Gtk.Label(sections[i]) {
            //             halign = FILL,
            //             hexpand = true,
            //         };
            //         tmp.append(label);
            //         if (i < sections.length-2) {
            //             var separator = new Gtk.Separator(VERTICAL);
            //             tmp.append(separator);
            //         }
            //     }
            //     row.child = tmp;
            // } else
            if (text.has_prefix("***")) {
                var temp = new Gtk.Box(VERTICAL, 6);
                var heading = new Gtk.Label(text.slice(3, text.index_of("***", 4)-1)) {
                    margin_start = 12,
                    margin_end = 12,
                    margin_top = 12,
                    css_classes = {"heading"},
                };
                var label = new Gtk.Label(text.slice(text.index_of("***", 4)+4, -1)) {
                    wrap = true,
                    margin_bottom = 12,
                    margin_start = 12,
                    margin_end = 12,
                };
                temp.append(heading);
                temp.append(label);
                row.child = temp;
            } else {
                var label = new Gtk.Label(text) {
                    wrap = true,
                    margin_bottom = 12,
                    margin_start = 12,
                    margin_end = 12,
                    margin_top = 12,
                };
                row.child = label;
            }
            box.append(row);
        }
        this.child = box;
    }
}
class Libellus.StatGridModule : Adw.Bin {
    public StatGridModule (MapValue data, Tab tab) {
        var box = new Adw.WrapBox() {
            child_spacing = 10,
            line_spacing = 10,
            justify = FILL,
            justify_last_line = false,
            halign = CENTER,
        };
        foreach (var v in data.map["content"].as_arr()) {
            var item = v.as_map();
            var b = new Gtk.Box(Gtk.Orientation.VERTICAL, 5);
            b.width_request = 70;
            b.add_css_class("card");
            var title = new Gtk.Label(item["title"].as_str()) {
                margin_top = 15,
                margin_start = 10,
                margin_end = 10,
            };
            b.append(title);
            var str = item["content"].as_str();
            if (str.has_prefix("@")) {
                var link = new LinkButton(str, tab);
                link.margin_bottom = 5;
                link.margin_start = 5;
                link.margin_end = 5;

                b.append(link);
            } else {
                var subtitle = new Gtk.Label(str) {
                    css_classes = {"heading"},
                    margin_bottom = 10,
                    margin_start = 10,
                    margin_end = 10,
                    margin_top = 8,
                };
                b.append(subtitle);
            }
            box.append(b);
        }
        this.child = box;
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/modules/statgrid-module-edit-tile.ui")]
class Libellus.StatgridModuleEditTile : Gtk.Box {
    [GtkChild]
    public unowned Gtk.Entry title;
    [GtkChild]
    public unowned Gtk.Entry subtitle;

    public MapValue data;

    public StatgridModuleEditTile(MapValue data) {
        title.text = data.map["title"].as_str();
        subtitle.text = data.map["content"].as_str();
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/modules/statgrid-module-edit-tile-new.ui")]
class Libellus.StatgridModuleEditTileNew : Gtk.Button {
    public StatgridModuleEditTileNew() {
    }
}


class Libellus.StatGridModuleEdit : Adw.Bin {
    public StatGridModuleEdit (MapValue data) {
        var box = new Adw.WrapBox() {
            child_spacing = 10,
            line_spacing = 10,
            justify = FILL,
            justify_last_line = false,
            halign = CENTER,
        };
        Gtk.Widget last = null;
        foreach (var v in data.map["content"].as_arr()) {
            var b = new StatgridModuleEditTile((MapValue)v);
            box.insert_child_after(b, last);
            last = b;
        }
        box.append(new StatgridModuleEditTileNew());
        this.child = box;
    }
}

class Libellus.TableModule : Gtk.Grid {
    public TableModule(MapValue v) {
        this.add_css_class("card");
        var y = 0;
        foreach (var row in v.map["content"].as_arr()) {
            var x = 0;
            foreach (var cell in row.as_arr()) {
                var label = new Gtk.Label(cell.as_str());
                label.halign = FILL;
                label.hexpand = true;
                label.margin_top = 10;
                label.margin_bottom = 10;
                this.attach(label, x == 0 ? x : x+1, y, 1, 1);
                x++;
            }
            y += 2;
        }
        var hbar = new Gtk.Separator(HORIZONTAL);
        hbar.halign = CENTER;
        var vbar = new Gtk.Separator(VERTICAL);
        vbar.valign = CENTER;
        this.attach(vbar, 0, 1, v.map["content"].as_arr()[0].as_arr().size + 1);
        this.attach(hbar, 1, 0, 1, 3);
    }
}

class Libellus.CycleModule : Gtk.Box {
    Adw.Bin content;
    MapValue map_value;
    Tab tab;
    public CycleModule(MapValue v, Tab tab) {
        this.orientation = VERTICAL;
        this.map_value = v;
        this.tab = tab;
        var header = new Gtk.Box(HORIZONTAL, 10) {
            halign = CENTER,
        };
        var title = new Gtk.Label(v.map["title"].as_str()) {
            css_classes = {"title-3"},
        };
        var spinner = new Gtk.SpinButton.with_range(1, v.map["max"].as_num(), 1);
        spinner.adjustment.value_changed.connect(() => {
            update_content((int)spinner.adjustment.value-1);
        });
        header.append(title);
        header.append(spinner);
        this.append(header);
        this.content = new Adw.Bin();
        update_content(0);
        this.append(this.content);
    }
    void update_content(int number) {
        this.content.child = Page.build_content((ArrValue) map_value.map["content"].as_arr()[number], tab);
    }
}

