import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

export const SourceDialog = GObject.registerClass({
  GTypeName: 'SourceDialog',
  Template: 'resource:///de/hummdudel/Libellus/source_dialog.ui',
  Children: ["source_list"],
  Signals: {
    "imported_source": {
      "param_types": [ GObject.TYPE_STRING ],
    },
    "load_source": {
      "param_types": [ GObject.TYPE_INT ],
    },
    "delete_source": {
      "param_types": [ GObject.TYPE_INT ],
    },
  },
}, class extends Adw.Dialog {
  constructor(sources) {
    super({});
    for (let i in sources) {
      let row = new SourceRow(sources[i].name, sources[i].built_in);
      row.connect("activated", () => {
        this.emit("load_source", i);
        this.close();
      });
      row.connect("removed", () => {
        const file = Gio.File.new_for_path(GLib.build_filenamev( [
            GLib.get_user_data_dir(),
            "Sources",
            sources[i].path ] ));

        file.delete(null);
        this.emit("delete_source", i);
        this.close();
      });
      this.source_list.append(row);
    }
  }

  import_source () {
    const dialog = new Adw.AlertDialog( {
      heading: "Warning",
      body: "Sources can execute arbitrary code, only use sources from places you trust!" } );

    dialog.add_response("C", "Cancel");
    dialog.add_response("O", "Ok");
    dialog.set_response_appearance("C", Adw.ResponseAppearance.SUGGESTED);
    dialog.set_response_appearance("O", Adw.ResponseAppearance.DESTRUCTIVE);

    dialog.connect("response", (_, c) => {
      if (c == "C") {
        return;
      } else if (c == "O") {
        const fileDialog = new Gtk.FileDialog();
        fileDialog.open(this.get_root(), null, (self, result) => {
          try {
            const file = self.open_finish(result);
            if (file) {
              const destination = Gio.File.new_for_path(GLib.build_filenamev( [
                GLib.get_user_data_dir(),
                "Sources",
                file.get_basename() ] ));

              const bytes = file.load_bytes (null)[0];
              const stream = destination.create(Gio.FileCreateFlags.NONE, null);
              const bytes_written = stream.write_bytes(bytes, null);

              // This fails with "Gio.IOErrorEnum: Error splicing file: Input/output error",
              // no idea how to fix that (and searching the error is also not that helpful)
              // file.copy(destination, Gio.FileCopyFlags.NONE, null, null);

              this.emit("imported_source", destination.get_basename());
              this.close();
            }
          } catch(e) {
            log("oops: " + e);
          }
        });
      } else {
        log("WELL OOOOPS");
        return;
      }
    });
    dialog.present(this);

  }
});

export const SourceRow = GObject.registerClass({
  GTypeName: 'SourceRow',
  Template: 'resource:///de/hummdudel/Libellus/source_row.ui',
  Children: ["remove_button"],
  Signals: {
    "removed": {},
  },
}, class extends Adw.ActionRow {
  constructor(title, built_in) {
    super( { title: title } );
    this.removable = built_in;
    if (built_in) {
      this.remove_button.visible = false;
    }
  }

  remove_row() {
    const dialog = new Adw.AlertDialog( {
      heading:"Delete “"+this.title+"”?",
      body: "This action can not be undone." } );

    dialog.add_response("C", "Cancel");
    dialog.add_response("D", "Delete");
    dialog.set_response_appearance("C", Adw.ResponseAppearance.SUGGESTED);
    dialog.set_response_appearance("D", Adw.ResponseAppearance.DESTRUCTIVE);

    dialog.connect("response", (_, c) => {
      if (c == "C") {
        return;
      } else if (c == "D") {
        this.emit("removed");
      } else {
        log("WELL OOOOPS");
        return;
      }
    });
    dialog.present(this);
  }
});

