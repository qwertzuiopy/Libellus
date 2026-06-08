[GtkTemplate (ui = "/de/hummdudel/Libellus/searchpage.ui")]
class Libellus.SearchPage : Adw.NavigationPage {
    [GtkChild]
    public unowned Gtk.ListView listview;
    [GtkChild]
    unowned Gtk.Entry entry;
    [GtkChild]
    public unowned Gtk.Button filter_button;

    Window window;
    Tab tab;
    SearchFilter search_filter;
    public Gtk.FilterListModel origin_model;

    FilterDialog filter;

    public SearchPage(Window window, Tab tab) {
        this.window = window;
        this.tab = tab;
        this.listview.factory = this.window.factory;

        this.search_filter = new SearchFilter("");
        this.entry.changed.connect(() => {
            this.search_filter.update_term (this.entry.text);
        });

        this.origin_model = new Gtk.FilterListModel(this.window.liststore, this.search_filter);

        this.listview.model = new Gtk.NoSelection(this.origin_model);
        this.listview.show_separators = true;
        this.listview.activate.connect((position) => {
            var v = (MapValue) this.listview.model.get_item(position);
            this.tab.navview.push(new Page(this.window.data_folder.get_child(((StrValue)v.map["id"]).str), this.window, this.tab));
            this.tab.update_title.begin();
        });
        this.filter = new FilterDialog(this.window, this);
        filter_button.clicked.connect(() => {
            this.filter.present(this.window);
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
    public Gtk.Label title;
    public Gtk.Label subtitle;
    public SearchEntry () {
        this.orientation = HORIZONTAL;

        var box = new Gtk.Box(VERTICAL, 0) {
            margin_start = 8,
        };
        this.title = new Gtk.Label("") {
            // css_classes = { "heading" },
            margin_top = 8,
            margin_bottom = 0,
            hexpand = true,
            halign = START,
        };
        this.subtitle = new Gtk.Label("") {
            css_classes = { "dimmed" },
            margin_top = 0,
            margin_bottom = 4,
            hexpand = true,
            halign = START,
        };
        var arrow = new Gtk.Image.from_icon_name("go-next-symbolic") {
            margin_end = 12,
        };
        box.append(this.title);
        box.append(this.subtitle);
        this.append(box);
        this.append(arrow);
    }
}
