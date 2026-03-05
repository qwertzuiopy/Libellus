public class Libellus.Bookmarks : Object {
    public signal void changed();
    public ArrValue bookmarks;
    public Bookmarks (Window window) {
        uint8[] contents;
        string etag_out;
        try {
            window.bookmark_file.load_contents (null, out contents, out etag_out);
            this.bookmarks = (ArrValue)Value.from_str((string) contents);
            this.changed.connect(() => {
                try {
                    if (window.bookmark_file.query_exists ()) {
                        window.bookmark_file.delete ();
                    }
                    var dos = new DataOutputStream (window.bookmark_file.create(FileCreateFlags.REPLACE_DESTINATION));
                    dos.put_string (this.bookmarks.to_str());
                } catch (Error e) {
                    critical(e.message);
                }
            });
        } catch (Error e) {
            critical(e.message);
        }
    }
    public bool is_bookmarked(string id) {
        foreach (var bookmark in this.bookmarks.arr) {
            if (((StrValue)((MapValue)bookmark).map["id"]).str == id) {
                return true;
            }
        }
        return false;
    }
    public void remove_bookmark(string id) {
        foreach (var bookmark in this.bookmarks.arr) {
            if (((StrValue)((MapValue)bookmark).map["id"]).str == id) {
                this.bookmarks.arr.remove(bookmark);
                this.changed();
                return;
            }
        }
    }
}

class Libellus.BookmarkMenu : Gtk.Popover {
    Window window;
    Gtk.ListBox listbox;
    public BookmarkMenu (Window window) {
        this.window = window;
        this.window.bookmarks.changed.connect(this.update);
        this.listbox = new Gtk.ListBox() {
            selection_mode = NONE,
            css_classes = {"navigation-sidebar", "bookmark" },
        };
        this.listbox.row_activated.connect((row) => {
            ((BookmarkRow)row).open();
            this.popdown();
        });
        this.child = this.listbox;
        this.update();
    }
    void update () {
        this.listbox.remove_all();
        foreach(var bookmark in this.window.bookmarks.bookmarks.arr) {
            this.listbox.append(new BookmarkRow((MapValue)bookmark, this.window));
        }
    }
}

class Libellus.BookmarkRow : Gtk.ListBoxRow {
    MapValue bookmark;
    Window window;
    public BookmarkRow (MapValue bookmark, Window window) {
        this.window = window;
        this.bookmark = bookmark;
        this.add_css_class("bookmark");
        var box = new Gtk.Box(HORIZONTAL, 10);
        box.append(new Gtk.Label(((StrValue)this.bookmark.map["name"]).str) { hexpand = true, margin_start = 6 } );
        var delete_button = new Gtk.Button() {
            icon_name = "edit-clear-symbolic",
            css_classes = {"flat", "circular"},
        };
        delete_button.clicked.connect(() => {
            this.window.bookmarks.bookmarks.arr.remove(this.bookmark);
            this.window.bookmarks.changed();
        });
        box.append(delete_button);
        this.child = box;
    }
    public void open() {
        window.open(((StrValue)this.bookmark.map["id"]).str);
    }
}
