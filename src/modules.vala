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
            var row = new Gtk.ListBoxRow();
            var label = new Gtk.Label(((StrValue)v).str);
            label.wrap = true;
            label.margin_top = 10;
            label.margin_bottom = 10;
            label.margin_start = 10;
            label.margin_end = 10;
            row.child = label;
            box.append(row);
        }
        this.child = box;
    }
}
class Libellus.StatGridModule : Adw.Bin {
    public StatGridModule (MapValue data) {
        var box = new Adw.WrapBox();
        box.child_spacing = 10;
        box.line_spacing = 10;
        box.justify = Adw.JustifyMode.FILL;
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
