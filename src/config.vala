using GLib;

public class Libellus.Config : Object {
    File file;
    File sources_folder;
    MapValue val;
    public Config() {
        file = File.new_build_filename(GLib.Environment.get_user_data_dir(), "sources");
        if (!file.query_exists()) {
            var file_stream = file.create(FileCreateFlags.NONE);
            var data_stream = new DataOutputStream (file_stream);
            data_stream.put_string ("{ default_source: {folder: \"\", name: \"\"}, sources: [], folder: \""+File.new_build_filename(GLib.Environment.get_user_data_dir(), "data").get_path()+"\"}");
            File.new_build_filename(GLib.Environment.get_user_data_dir(), "data").make_directory();
            write_config();
        }
        uint8[] contents;
        string etag_out;
        file.load_contents (null, out contents, out etag_out);
        val = (MapValue) Value.from_str((string) contents);
        sources_folder = File.new_for_path(((StrValue) val.map["folder"]).str);
    }
    public ArrValue get_sources() {
        return (ArrValue) val.map["sources"];
    }
    public MapValue get_default() {
        return (MapValue) val.map["default_source"];
    }
    public async void add_source(File data) {
        try {
            var desc = data.get_child("desc");
            uint8[] contents;
            string etag_out;
            desc.load_contents (null, out contents, out etag_out);
            var desc_val = (MapValue) Value.from_str((string) contents);

            var dst_path = File.new_build_filename(sources_folder.get_path(), "source"+GLib.Random.next_int().to_string());
            GLib.Process.spawn_command_line_sync("cp -r "+data.get_path()+" "+dst_path.get_path());
            var entry = new MapValue();
            entry.map["folder"] = new StrValue(dst_path.get_path());
            entry.map["name"] = new StrValue(((StrValue) desc_val.map["name"]).str);
            ((ArrValue)val.map["sources"]).arr.add(entry);
            val.map["default_source"] = entry;

            write_config();
        } catch (Error e) {
            critical(e.message);
        }
    }
    public void delete_source(MapValue v) {
        var arr = ((ArrValue) val.map["sources"]).arr;
        var index = arr.index_of(v);
        if (index == -1) {
            critical("source not found!");
        }
        arr.remove_at(index);
        if (get_default() == v && arr.size > 0) {
            val.map["default_source"] = arr[0];
        }
        var f = File.new_for_path(((StrValue)v.map["folder"]).str);
        GLib.Process.spawn_command_line_sync("rm -r "+f.get_path());
        write_config();
    }

    public void write_config() {
        file.replace_contents(val.to_str().data, null, false, NONE, null);
    }
}
