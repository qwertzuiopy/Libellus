[GtkTemplate (ui = "/de/hummdudel/Libellus/search_page.ui")]
class Libellus.SearchPage : Adw.NavigationPage {
    [GtkChild]
    unowned Gtk.ListView listview;

    Window window;

    public SearchPage(Window window) {
        this.window = window;
        listview.factory = window.factory;
        listview.model = new Gtk.NoSelection(window.liststore);
        listview.show_separators = true;
    }
}

class Libellus.SearchEntry : Gtk.Box {
    public Gtk.Label label;
    public SearchEntry () {
        this.orientation = HORIZONTAL;
        this.label = new Gtk.Label("") {
            margin_top = 12,
            margin_bottom = 12,
            hexpand = true,
        };
        var arrow = new Gtk.Image.from_icon_name("go-next-symbolic") {
            margin_end = 12,
        };
        this.append(this.label);
        this.append(arrow);
    }
}
