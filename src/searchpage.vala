[GtkTemplate (ui = "/de/hummdudel/Libellus/search_page.ui")]
class Libellus.SearchPage : Adw.NavigationPage {
    [GtkChild]
    unowned Gtk.ListView listview;
    [GtkChild]
    unowned Gtk.Entry entry;

    Window window;
    Tab tab;
    SearchFilter search_filter;

    public SearchPage(Window window, Tab tab) {
        this.window = window;
        this.tab = tab;
        this.listview.factory = this.window.factory;

        this.search_filter = new SearchFilter("");
        this.entry.changed.connect(() => {
            this.search_filter.update_term (this.entry.text);
        });

        Gtk.FilterListModel filter = new Gtk.FilterListModel(this.window.liststore, this.search_filter);

        this.listview.model = new Gtk.NoSelection(filter);
        this.listview.show_separators = true;
        this.listview.activate.connect((position) => {
            var v = (MapValue) this.listview.model.get_item(position);
            this.tab.navview.push(new Page(this.window.data_folder.get_child(((StrValue)v.map["id"]).str), this.window));
            this.tab.update_title.begin();
        });

    }
}

class Libellus.SearchFilter : Gtk.Filter {
    string term;
    Gtk.FilterMatch strictness;

    public SearchFilter (string term) {
        this.update_term (term);
    }

    public void update_term (string term) {
        this.term = term.ascii_down ();
        if (this.term == "") {
            this.strictness = ALL;
        } else {
            this.strictness = SOME;
        }
        this.changed (DIFFERENT);
    }

    public override bool match (Object? item) {
        if (this.term == "") {
            return true;
        }
        var map = (MapValue) item;
        if (((StrValue) map.map["name"]).str.ascii_down ().contains (this.term)) {
            return true;
        } else {
            return false;
        }
    }
    public override Gtk.FilterMatch get_strictness () {
        return this.strictness;
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
