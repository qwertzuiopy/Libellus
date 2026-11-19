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
class Libellus.LinkListModuleEdit : Adw.Bin {
    public LinkListModuleEdit (MapValue data, EditDialog dialog) {
        var box = new Gtk.ListBox () {
            css_classes = {"boxed-list"},
            selection_mode = NONE,
            halign = FILL,
            hexpand = true,
        };
        foreach (var row in data.map["content"].as_arr()) {
            var str = row.as_map()["id"].as_str();
            var inner = new Gtk.Box(HORIZONTAL, 6);
            inner.append(new Gtk.Image() {
                icon_name = "draggable",
            });
            inner.append(new Gtk.Button() {
                icon_name = "user-trash-symbolic",
                css_classes = {"destructive-action"},
                valign = CENTER,
            });
            inner.append(new LinkSelector((StrValue)row.as_map()["id"], dialog));
            inner.append(new Gtk.Entry() {
                text = row.as_map()["content"].as_str(),
                margin_top = 6,
                margin_bottom = 6,
                hexpand = true,
                margin_end = 6,
            });
            var item = new Gtk.ListBoxRow() {
                child = inner,
                selectable = false,
                activatable = false,
                halign = FILL,
            };
            box.append(item);
        }
        box.append(new Adw.ButtonRow() {
            start_icon_name = "plus-framed-symbolic",
        });
        this.child = box;
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

class Libellus.StatListModuleEdit : Adw.Bin {
    public StatListModuleEdit (MapValue data) {
        var listbox = new Gtk.ListBox() {
            selection_mode = NONE,
            css_classes = {"boxed-list"},
            hexpand = true
        };
        foreach (var row in data.map["content"].as_arr()) {
            var box = new Gtk.Box(VERTICAL, 6) {
                margin_start = 6,
            };
            var title_box = new Gtk.Box(HORIZONTAL, 6) {};
            title_box.append(new Gtk.Image() {
                icon_name = "draggable",
                valign = CENTER,
            });
            title_box.append(new Gtk.Button() {
                icon_name = "user-trash-symbolic",
                css_classes = {"destructive-action"},
                valign = CENTER,
            });
            var title_label = new Gtk.Entry() {
                text = row.as_map()["title"].as_str(),
                css_classes = {"heading"},
                margin_top = 6,
                margin_bottom = 6,
                margin_end = 6,
                halign = FILL,
                hexpand = true,
                valign = START,
                vexpand = false
            };
            title_box.append(title_label);
            box.append(title_box);
            var list = new Adw.WrapBox() {
                margin_start = 6,
                margin_end = 6,
                margin_bottom = 6,
                line_spacing = 6,
                child_spacing = 6,
            };
            var entries = row.as_map()["content"].as_arr();
            foreach (var entry in entries) {
                var str = entry.as_str();
                var item = new Gtk.Box(HORIZONTAL, 6) {
                    css_classes = {"card"},
                };
                item.append(new Gtk.Image() {
                    icon_name = "draggable-symbolic",
                });
                item.append(new Gtk.Button() {
                    icon_name = "user-trash-symbolic",
                    css_classes = {"destructive-action"},
                    valign = CENTER
                });
                item.append(new Gtk.Entry() {
                    text = str,
                    margin_top = 6,
                    margin_end = 6,
                    margin_bottom = 6,
                });
                list.append(item);
            }
            list.append(
                new Gtk.Button() {
                    icon_name = "plus-framed-symbolic",
                }
            );

            box.append(list);
            listbox.append(new Gtk.ListBoxRow() {
                child = box,
                activatable = false,
                valign = CENTER,
            });
        }
        listbox.append(new Adw.ButtonRow() {
            start_icon_name = "plus-framed-symbolic",
        });
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
class Libellus.TextModule : Adw.Bin {
    public TextModule (MapValue data) {
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
            var label = new Gtk.Label(text) {
                wrap = true,
                margin_bottom = 12,
                margin_start = 12,
                margin_end = 12,
                margin_top = 12,
            };
            row.child = label;
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

    public bool highlighted = false;

    public StatgridModuleEditTile(MapValue data, Adw.WrapBox list) {
        title.text = data.map["title"].as_str();
        subtitle.text = data.map["content"].as_str();

        var source = new Gtk.DragSource() {
            actions = MOVE
        };
        double drag_x = 0.0;
        double drag_y = 0.0;
        source.prepare.connect((x, y) => {
            drag_x = x; drag_y = y;
            var val = GLib.Value(typeof (StatgridModuleEditTile));
            val.set_object(this);
            return new Gdk.ContentProvider.for_value(val);
        });
        source.drag_begin.connect((drag) => {
            var drag_widget = new Adw.Bin();

            drag_widget.set_size_request(this.get_width(), this.get_height());
            drag_widget.add_css_class("card");

            var icon = new Gtk.DragIcon.get_for_drag(drag) as Gtk.DragIcon;
            icon.child = drag_widget;

            drag.set_hotspot((int) drag_x, (int) drag_y);
        });

        var drop = new Gtk.DropControllerMotion();
        drop.enter.connect(() => { this.css_classes = {}; highlighted = true; });
        drop.leave.connect(() => { this.css_classes = {"card"}; highlighted = false; });

        this.add_controller(source);
        this.add_controller(drop);
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/modules/statgrid-module-edit-tile-new.ui")]
class Libellus.StatgridModuleEditTileNew : Gtk.Button {
    public StatgridModuleEditTileNew() {
    }
}


class Libellus.StatGridModuleEdit : Adw.Bin {
    public StatGridModuleEdit (MapValue data) {
        var tiles = new Gee.ArrayList<StatgridModuleEditTile>();
        var box = new Adw.WrapBox() {
            child_spacing = 10,
            line_spacing = 10,
            justify = FILL,
            justify_last_line = false,
            halign = CENTER,
        };
        var target = new Gtk.DropTarget(typeof (StatgridModuleEditTile), Gdk.DragAction.MOVE);
        box.add_controller(target);
        target.drop.connect((drop, value, x, y) => {
            var value_row = value.get_object() as StatgridModuleEditTile?;
            StatgridModuleEditTile? target_row = null;
            foreach (var val in tiles) {
                if (val.highlighted) {
                    target_row = val;
                }
                val.highlighted = false;
            }

            if (value_row == null || target_row == null) {
                return false;
            }

            if (value_row == target_row) {
                return true;
            }

            box.remove(value_row);
            box.insert_child_after(value_row, target_row);

            return true;
        });
        Gtk.Widget last = null;
        foreach (var v in data.map["content"].as_arr()) {
            var b = new StatgridModuleEditTile((MapValue)v, box);
            tiles.add(b);
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

[GtkTemplate (ui = "/de/hummdudel/Libellus/modules/link-selector.ui")]
class Libellus.LinkSelector : Gtk.Button {
    [GtkChild]
    public unowned Gtk.Label label;
    public LinkSelector(StrValue value, EditDialog dialog) {
        var owned_id = value.str;
        this.valign = CENTER;
        if (owned_id.has_prefix("@")) {
            owned_id = owned_id.substring(1, owned_id.length-1);
        }
        var data = dialog.window.fetch_dir_for_id(owned_id);
        if (data == null) {
            this.label.label = "[NOT FOUND]"+owned_id;
        } else {
            this.label.label = data.map["name"].as_str();
        }
    }
}
