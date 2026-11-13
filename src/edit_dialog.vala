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
        var box = new Gtk.ListBox() {
          margin_start = 12,
          margin_end = 12,
          margin_top = 12,
          margin_bottom = 24,
          css_classes = {"boxed-list"},
          valign = START,
        };

        var target = new Gtk.DropTarget(typeof (EditContainer), Gdk.DragAction.MOVE);
        box.add_controller(target);
        target.drop.connect((drop, value, x, y) => {
            var value_row = value.get_object() as EditContainer?;
            EditContainer? target_row = box.get_row_at_y((int) y) as EditContainer?;

            if (value_row == null || target_row == null) {
                return false;
            }

            int target_index = target_row.get_index();

            box.remove(value_row);
            box.insert(value_row, target_index);
            target_row.set_state_flags(Gtk.StateFlags.NORMAL, true);

            return true;
        });

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
                box.append(new EditContainer(w, box));
            }
        }
        return box;
    }
}

[GtkTemplate (ui = "/de/hummdudel/Libellus/edit-container.ui")]
public class Libellus.EditContainer : Gtk.ListBoxRow {
    [GtkChild]
    unowned Gtk.Box box;

    [GtkChild]
    unowned Gtk.Widget drag_target;

    public EditContainer (Gtk.Widget child, Gtk.ListBox list) {
        this.box.append(child);
        var source = new Gtk.DragSource() {
            actions = MOVE
        };
        double drag_x = 0.0;
        double drag_y = 0.0;
        source.prepare.connect((x, y) => {
            drag_x = x; drag_y = y;
            var val = GLib.Value(typeof (EditContainer));
            val.set_object(this);
            return new Gdk.ContentProvider.for_value(val);
        });
        source.drag_begin.connect((drag) => {
            var drag_widget = new Gtk.ListBox();

            drag_widget.set_size_request(this.get_width(), 0);
            drag_widget.add_css_class("boxed-list");

            var drag_row = new Adw.ActionRow() {
                title = "blah",
            };

            drag_row.add_prefix(
                new Gtk.Image.from_icon_name("list-drag-handle-symbolic") {
                    css_classes = { "dim-label" }
                }
            );

            drag_widget.append(drag_row);
            drag_widget.drag_highlight_row(drag_row);

            var icon = new Gtk.DragIcon.get_for_drag(drag) as Gtk.DragIcon;
            icon.child = drag_widget;

            drag.set_hotspot((int) drag_x, 10);
        });

        var drop = new Gtk.DropControllerMotion();
        drop.enter.connect(() => list.drag_highlight_row(this));
        drop.leave.connect(() => list.drag_unhighlight_row());

        this.drag_target.add_controller(source);
        this.add_controller(drop);
    }
}
