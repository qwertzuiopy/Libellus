/* window.vala
 *
 * Copyright 2025 luna
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

[GtkTemplate (ui = "/de/hummdudel/Libellus/window.ui")]
public class Libellus.Window : Adw.ApplicationWindow {
    [GtkChild]
    private unowned Gtk.Label label;

    public Window (Gtk.Application app) {
        Object (application: app);

        test.begin ();
    }
    public async void test () {
        var file_dialog = new Gtk.FileDialog ();

        try {
            File file = yield file_dialog.open (this, null);
            uint8[] contents;
            string etag_out;
            file.load_contents (null, out contents, out etag_out);
            Data d = new Data((string) contents);
        } catch (Error e) {
            critical (e.message);
        }
    }
}

public class Libellus.Page : Adw.Bin {
    public MapValue data;
    public Page (File file) {
        try {
            uint8[] contents;
            string etag_out;
            file.load_contents (null, out contents, out etag_out);
            Value v = Value.from_str((string) contents);
            if (!(v is MapValue)) {
                GLib.error("expected toplevel node to be a map");
            }
            this.data = (MapValue) v;
        } catch (Error e) {
            critical (e.message);
        }
    }
}
