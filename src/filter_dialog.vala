[GtkTemplate (ui = "/de/hummdudel/Libellus/filter_dialog.ui")]
class Libellus.FilterDialog : Adw.Dialog {
    [GtkChild]
    public unowned Adw.NavigationView navview;
    [GtkChild]
    unowned Gtk.ListBox box;
    [GtkChild]
    unowned Adw.ButtonRow clear_button;

    Window window;
    public SearchPage page;

    public FilterDialog (Window window, SearchPage page) {
        this.window = window;
        this.page = page;
        this.clear_button.activated.connect(() => {
            this.page.listview.model = new Gtk.NoSelection(this.page.origin_model);
            this.page.filter_button.css_classes = {};
            this.page.filter_button.icon_name = "funnel-outline-symbolic";
            this.close();
        });
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

    public Gtk.FilterListModel model;

    public FilterPage (FilterDialog dialog, MapValue data) {
        this.title = ((StrValue)data.map["title"]).str;
        var cat_filter = new DropdownFilter(((StrValue)data.map["value"]).str, "category");
        this.model = new Gtk.FilterListModel(dialog.page.origin_model, cat_filter);

        this.apply_button.activated.connect(() => {
            dialog.page.listview.model = new Gtk.NoSelection(this.model);
            dialog.page.filter_button.css_classes = {"accent"};
            dialog.page.filter_button.icon_name = "funnel-symbolic";
            dialog.close();
        });

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

                    var filter = new DropdownFilter("any", ((StrValue)row.map["field"]).str);
                    this.model = new Gtk.FilterListModel(this.model, filter);

                    comborow.notify["selected"].connect(() => {
                        var str = "";
                        if (comborow.selected == 0) {
                            str = "any";
                        } else {
                            var map = (MapValue)((ArrValue)row.map["options"]).arr[(int)comborow.selected-1];
                            str = ((StrValue)map.map["value"]).str;
                        }
                        filter.update_term(str);
                    });
                    break;
                case "ArrayDropdown":
                    var comborow = new Adw.ComboRow ();
                    var list = new Gtk.StringList({"any"});
                    foreach (var option in ((ArrValue)row.map["options"]).arr) {
                        list.append(((StrValue)((MapValue)option).map["title"]).str);
                    }
                    comborow.model = list;
                    comborow.title = ((StrValue)row.map["title"]).str;
                    this.box.insert(comborow, 0);

                    var filter = new ArrayDropdownFilter("any", ((StrValue)row.map["field"]).str);
                    this.model = new Gtk.FilterListModel(this.model, filter);

                    comborow.notify["selected"].connect(() => {
                        var str = "";
                        if (comborow.selected == 0) {
                            str = "any";
                        } else {
                            var map = (MapValue)((ArrValue)row.map["options"]).arr[(int)comborow.selected-1];
                            str = ((StrValue)map.map["value"]).str;
                        }
                        filter.update_term(str);
                    });
                    break;
                case "Range":
                    var adjustment = new Gtk.Adjustment(((NumValue)row.map["min"]).num, ((NumValue)row.map["min"]).num, ((NumValue)row.map["max"]).num, 1, 5, 0);
                    var spinrow = new Adw.SpinRow(null, 1, 0);
                    spinrow.title = ((StrValue)row.map["title"]).str;
                    var enabled = new Gtk.Switch() { valign = CENTER, state = false };
                    spinrow.add_suffix(enabled);
                    this.box.insert(spinrow, 0);

                    var filter = new RangeFilter(((NumValue)row.map["min"]).num, ((StrValue)row.map["field"]).str);
                    this.model = new Gtk.FilterListModel(this.model, filter);

                    enabled.state_set.connect((state) => {
                        if (state) {
                            spinrow.adjustment = adjustment;
                            filter.enabled = true;
                            filter.update_term(spinrow.adjustment.value);
                        } else {
                            spinrow.adjustment = null;
                            filter.enabled = false;
                            filter.update_term(spinrow.adjustment.value);
                        }
                        return false;
                    });

                    adjustment.value_changed.connect(() => {
                        filter.update_term(spinrow.adjustment.value);
                    });

                    break;
                default:
                    critical(@"got unknown filter $id");
                    break;
            }
        }
    }
}

class Libellus.ArrayDropdownFilter : Gtk.Filter {
    string val;
    string field;
    bool enabled;
    Gtk.FilterMatch strictness;

    public ArrayDropdownFilter (string val, string field) {
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
        if (!map.map.has_key(this.field)) {
            return false;
        }
        foreach (var key in ((ArrValue) map.map[this.field]).arr) {
            if (((StrValue)key).str == this.val) {
                return true;
            }
        }
        return false;
    }
    public override Gtk.FilterMatch get_strictness () {
        return this.strictness;
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
        if (map.map.has_key(this.field) &&
            ((StrValue) map.map[this.field]).str == this.val) {
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
        if (map.map.has_key(this.field) &&
            ((NumValue) map.map[this.field]).num == this.val) {
            return true;
        } else {
            return false;
        }
    }
    public override Gtk.FilterMatch get_strictness () {
        return this.strictness;
    }
}
