[GtkTemplate (ui = "/de/hummdudel/Libellus/filter_dialog.ui")]
class Libellus.FilterDialog : Adw.Dialog {
    [GtkChild]
    public unowned Adw.NavigationView navview;
    [GtkChild]
    unowned Gtk.ListBox box;
    [GtkChild]
    unowned Adw.ButtonRow clear_button;

    Window window;

    public FilterDialog (Window window) {
        this.window = window;
        foreach (var row in this.window.filter_data.arr) {
            this.box.insert(new CategoryFilterRow(this, (MapValue)row), 0);
        }
    }
}
class Libellus.CategoryFilterRow : Adw.ActionRow {
    public CategoryFilterRow (FilterDialog dialog, MapValue data) {
        this.add_suffix(new Gtk.Image() { icon_name = "go-next-symbolic" });
        this.title = ((StrValue)data.map["title"]).str;
        this.activatable = true;
        this.activated.connect(() => {
            dialog.navview.push(new FilterPage(dialog, data));
        });
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/filter_page.ui")]
class Libellus.FilterPage : Adw.NavigationPage {
    [GtkChild]
    unowned Gtk.ListBox box;
    [GtkChild]
    unowned Adw.ButtonRow apply_button;

    public Gtk.FilterListModel filter;

    public FilterPage (FilterDialog dialog, MapValue data, Gtk.FilterListModel origin) {
        this.title = ((StrValue)data.map["title"]).str;
        foreach (var v in ((ArrValue)data.map["filters"]).arr) {
            var row = (MapValue)v;
            string id = ((StrValue)row.map["id"]).str;
            switch (id) {
                case "Dropdown":
                    var comborow = new Adw.ComboRow ();
                    var list = new Gtk.StringList({"any"});
                    foreach (var option in ((ArrValue)row.map["options"]).arr) {
                        list.append(((StrValue)((MapValue)option).map["title"]).str);
                    }
                    comborow.model = list;
                    comborow.title = ((StrValue)row.map["title"]).str;
                    this.box.insert(comborow, 0);
                    break;
                case "Range":
                    var spinrow = new Adw.SpinRow.with_range(((NumValue)row.map["min"]).num, ((NumValue)row.map["max"]).num, 1.0);
                    spinrow.title = ((StrValue)row.map["title"]).str;
                    var enabled = new Gtk.Switch() { valign = CENTER };
                    spinrow.add_suffix(enabled);
                    this.box.insert(spinrow, 0);
                    break;
                default:
                    critical(@"got unknown filter $id");
                    break;
            }
        }
    }
}
class Libellus.DropdownFilter : Gtk.Filter {
    string val;
    string field;
    bool enabled;
    Gtk.FilterMatch strictness;

    public DropdownFilter (string val, string field) {
        this.field = field;
        this.update_term (val);
    }
    public void update_term (string val) {
        this.val = val;
        if (this.val == "any") {
            this.enabled = false;
            this.strictness = ALL;
        } else {
            this.enabled = true;
            this.strictness = SOME;
        }
        this.changed (DIFFERENT);
    }
    public override bool match (Object? item) {
        if (!this.enabled) {
            return true;
        }
        var map = (MapValue) item;
        if (((StrValue) map.map[this.field]).str == this.val) {
            return true;
        } else {
            return false;
        }
    }
    public override Gtk.FilterMatch get_strictness () {
        return this.strictness;
    }
}

class Libellus.RangeFilter : Gtk.Filter {
    double val;
    string field;
    public bool enabled = false;
    Gtk.FilterMatch strictness;

    public RangeFilter (double val, string field) {
        this.field = field;
        this.update_term (val);
    }
    public void update_term (double val) {
        this.val = val;
        if (this.enabled) {
            this.strictness = SOME;
        } else {
            this.strictness = ALL;
        }
        this.changed (DIFFERENT);
    }
    public override bool match (Object? item) {
        if (!this.enabled) {
            return true;
        }
        var map = (MapValue) item;
        if (((NumValue) map.map[this.field]).num == this.val) {
            return true;
        } else {
            return false;
        }
    }
    public override Gtk.FilterMatch get_strictness () {
        return this.strictness;
    }
}
