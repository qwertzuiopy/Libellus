class Libellus.SourcesMenu : Adw.Dialog {
    Window window;
    public SourcesMenu(Window window) {
        this.window = window;
        var sources = window.config.get_sources();
        var box = new Gtk.ListBox(){
            css_classes = {"boxed-list"},
            selection_mode = NONE,
            margin_top = 10,
            margin_bottom = 10,
            margin_start = 10,
            margin_end = 10,
        };
        foreach (var source in sources.arr) {
            var name = ((StrValue)((MapValue)source).map["name"]).str;
            var row = new Adw.ActionRow() {
                activatable = true,
            };
            row.title = name;
            var del = new Gtk.Button() {
                icon_name = "user-trash-symbolic",
                valign = CENTER,
                css_classes = { "destructive-action" },
            };
            del.clicked.connect(() => {
                message("blab");
                window.delete_source((MapValue)source);
                this.close();
            });
            row.add_suffix(del);
            row.add_suffix(new Gtk.Image() {
                icon_name = "go-next-symbolic",
            });
            row.activated.connect(()=>{
                window.load_source.begin(((StrValue)((MapValue)source).map["folder"]).str);
                this.close();
            });
            box.append(row);
        }
        var import = new Adw.ButtonRow(){
            title = "import",
        };
        import.activated.connect(import_source);
        box.append(import);
        this.child = box;
    }
    public async void import_source() {
        var file_dialog = new Gtk.FileDialog ();
        File folder = yield file_dialog.select_folder (window, null);
        this.child = new Adw.Spinner();
        yield window.import(folder);
        this.close();
    }
}
