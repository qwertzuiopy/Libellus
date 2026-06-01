[GtkTemplate (ui = "/de/hummdudel/Libellus/sources-dialog.ui")]
class Libellus.SourcesDialog : Adw.Dialog {
    [GtkChild] unowned Gtk.ListBox box;
    Window window;
    public SourcesDialog(Window window) {
        this.window = window;
        var sources = window.config.get_sources();
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
            if (((NumValue)((MapValue)source).map["builtin"]).num == 0) {
                del.clicked.connect(() => {
                    window.delete_source((MapValue)source);
                    this.close();
                });
                row.add_suffix(del);
            }
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
    }
    public async void import_source() {
        var file_dialog = new Gtk.FileDialog ();
        File folder = yield file_dialog.select_folder (window, null);
        this.child = new Adw.Spinner();
        yield window.import(folder);
        this.close();
    }
}
