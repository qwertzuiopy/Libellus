class Libellus.ImageModule : Adw.Bin {
    public ImageModule (MapValue data) {
        this.height_request = 300;
        this.hexpand = true;
        this.child = new Adw.Spinner();
        load.begin(data);
    }
    async void load(MapValue data) {
        var url = ((StrValue)data.map["url"]).str;
        var message = new Soup.Message("GET", url);
        var session = new Soup.Session();
        var bytes = yield session.send_and_read_async(message, 1, null);
        var texture = Gdk.Texture.from_bytes(bytes);
        var picture = new Gtk.Picture() {
            paintable = texture,
            css_classes = {"card"},
            halign = CENTER,
        };
        this.child = picture;
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
            var title = ((StrValue) ((MapValue) row).map["title"]);
            box.append(new Gtk.Label(title.str) {
                css_classes = {"heading"},
                margin_top = 6,
            });
            var content = ((StrValue) ((MapValue) row).map["content"]);
            box.append(new Gtk.Label(content.str) {
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
    public StatListModule (MapValue data) {
        var listbox = new Gtk.ListBox() {
            selection_mode = NONE,
            css_classes = {"boxed-list"},
        };
        var arr = (ArrValue)data.map["content"];
        foreach (var row in arr.arr) {
            var box = new Gtk.Box(HORIZONTAL, 6);
            var title = ((StrValue) ((MapValue) row).map["title"]);
            box.append(new Gtk.Label(title.str) {
                css_classes = {"heading"},
                margin_top = 12,
                margin_bottom = 12,
                margin_start = 12,
                hexpand = true,
                halign = START,
            });
            // box.append(new Gtk.Separator(VERTICAL));
            foreach (var entry in ((ArrValue)((MapValue)row).map["content"]).arr) {
                box.append(new Gtk.Label(((StrValue)entry).str) { margin_end = 6 } );
            }
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
        var label = new Gtk.Label(((StrValue)data.map["content"]).str);
        label.add_css_class("title-1");
        label.margin_top = 10;
        label.margin_bottom = 10;
        this.child = label;
    }
}
class Libellus.SubtitleModule : Adw.Bin {
    public SubtitleModule (MapValue data) {
        var label = new Gtk.Label(((StrValue)data.map["content"]).str);
        label.add_css_class("title-3");
        label.margin_top = 10;
        label.margin_bottom = 10;
        this.child = label;
    }
}
class Libellus.MultiTextModule : Adw.Bin {
    public MultiTextModule (MapValue data) {
        var box = new Gtk.ListBox();
        box.add_css_class("boxed-list");
        box.selection_mode = Gtk.SelectionMode.NONE;
        foreach (var v in ((ArrValue)((MapValue)data).map["content"]).arr) {
            var row = new Gtk.ListBoxRow() {
                activatable = false,
            };
            var text = ((StrValue)v).str;
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
    public StatGridModule (MapValue data) {
        var box = new Adw.WrapBox() {
            child_spacing = 10,
            line_spacing = 10,
            justify = FILL,
            justify_last_line = true,
        };
        ArrValue arr = (ArrValue)data.map["content"];
        foreach (var v in arr.arr) {
            var item = (MapValue) v;
            var b = new Gtk.Box(Gtk.Orientation.VERTICAL, 5);
            b.width_request = 70;
            b.add_css_class("card");
            var title = new Gtk.Label(((StrValue)item.map["title"]).str);
            title.margin_top = 15;
            title.margin_start = 10;
            title.margin_end = 10;
            b.append(title);
            var subtitle = new Gtk.Label(((StrValue)item.map["content"]).str);
            subtitle.add_css_class("heading");
            subtitle.margin_bottom = 15;
            subtitle.margin_start = 10;
            subtitle.margin_end = 10;
            b.append(subtitle);
            box.append(b);
        }
        this.child = box;
    }
}
class Libellus.TableModule : Gtk.Grid {
    public TableModule(MapValue v) {
        this.add_css_class("card");
        ArrValue rows = (ArrValue)v.map["content"];
        var y = 0;
        foreach (var row in rows.arr) {
            var x = 0;
            foreach (var cell in ((ArrValue)row).arr) {
                var label = new Gtk.Label(((StrValue)cell).str);
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
        this.attach(vbar, 0, 1, ((ArrValue)rows.arr[0]).arr.size + 1);
        this.attach(hbar, 1, 0, 1, 3);
    }
}
