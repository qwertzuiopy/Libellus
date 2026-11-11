[GtkTemplate (ui = "/de/hummdudel/Libellus/edit-dialog.ui")]
public class Libellus.EditDialog : Adw.Dialog {
    MapValue data;
    Window window;

    [GtkChild]
    unowned Adw.Clamp clamp;

    public EditDialog (File file, Window window) {
        this.window = window;
        try {
            uint8[] contents;
            string etag_out;
            file.load_contents (null, out contents, out etag_out);
            Value v = Value.from_str((string) contents);
            if (!(v is MapValue)) {
                GLib.error("expected toplevel node to be a map");
            }
            this.data = (MapValue) v;
            ArrValue content = (ArrValue) this.data.map["content"];
            clamp.child = build_content(content);
        } catch (Error e) {
            critical (e.message);
        }
    }

    public static Gtk.Widget build_content(ArrValue content) {
        Tab tab = null;
        var box = new Gtk.Box(VERTICAL, 10) {
          margin_start = 12,
          margin_end = 12,
          margin_top = 12,
          margin_bottom = 24,
        };
        foreach (var c in content.arr) {
            Gtk.Widget w = null;
            string id = c.as_map()["id"].as_str();
            switch (id) {
                case "Title":
                    w = new TitleModuleEdit((MapValue)c);
                    break;
                case "Subtitle":
                    w = new SubtitleModuleEdit((MapValue)c);
                    break;
                case "StatGrid":
                    w = new StatGridModuleEdit((MapValue)c);
                    break;
                case "LinkList":
                    break;
                case "MultiText":
                    break;
                case "Table":
                    break;
                case "StatList":
                    break;
                case "TitledText":
                    break;
                case "Image":
                    break;
                case "Cycle":
                    break;
                default:
                    GLib.error(@"unrecongnised Module '$id'");
            }
            if (w != null) {
                box.append(new EditContainer(w));
            }
        }
        return box;
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/edit-container.ui")]
public class Libellus.EditContainer : Gtk.Box {
    public EditContainer (Gtk.Widget child) {
        this.append(child);
        var source = new Gtk.DragSource();
        source.prepare.connect(() => {

            });
        this.add_controller(source);

    }
}
