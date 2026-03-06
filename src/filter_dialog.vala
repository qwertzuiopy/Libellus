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

    public FilterPage (FilterDialog dialog, MapValue data) {
        message(data.to_str());
        this.title = ((StrValue)data.map["title"]).str;
        foreach (var v in ((ArrValue)data.map["filters"]).arr) {
            var row = (MapValue)v;
            string id = ((StrValue)row.map["id"]).str;
            switch (id) {
                case "Dropdown":
                    this.box.insert(new DropdownFilter(row), 0);
                    break;
                case "Range":
                    var spinrow = new Adw.SpinRow.with_range(((NumValue)row.map["min"]).num, ((NumValue)row.map["max"]).num, 1.0);
                    spinrow.title = ((StrValue)data.map["title"]).str;
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

class Libellus.DropdownFilter : Adw.ComboRow {
    public DropdownFilter (MapValue data) {
        var list = new Gtk.StringList({"any"});
        foreach (var row in ((ArrValue)data.map["options"]).arr) {
            list.append(((StrValue)((MapValue)row).map["title"]).str);
        }
        this.model = list;
        this.title = ((StrValue)data.map["title"]).str;
    }
}
