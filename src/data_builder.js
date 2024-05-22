// Convert the .json data files into one .js file which to be easily loaded
// and convert arrays of objects with an index member into objects where
// the key is that index member so the whole array does not have to be looped


import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

export const process = (window) => {
  let paths = [
    "Ability-Scores",
    "Alignments",
    "Backgrounds",
    "Classes",
    "Conditions",
    "Damage-Types",
    "Equipment",
    "Equipment-Categories",
    "Feats",
    "Features",
    "Languages",
    "Levels",
    "Magic-Items",
    "Magic-Schools",
    "Monsters",
    "Proficiencies",
    "Races",
    "Rules",
    "Rule-Sections",
    "Skills",
    "Spells",
    "Subclasses",
    "Subraces",
    "Traits",
    "Weapon-Properties"
  ]

  const decoder = new TextDecoder('utf-8');

  let data = {};

  for (let i in paths) {
    let filename = "resource:///de/hummdudel/Libellus/api/5e-SRD-"+paths[i]+".json"
    let file = Gio.File.new_for_uri(filename)
    const [_, contents] = file.load_contents(null)
    const contentsString = decoder.decode(contents)
    let old_object = JSON.parse(contentsString)
    let new_object = {};
    for (let j in old_object) {
      new_object [old_object[j].index] = old_object[j];
    }

    data[paths[i].toLowerCase(paths[i].replace("-", "_"))] = new_object;
  }


  let dialog = new Gtk.FileDialog();
  dialog.save (window, null, (object, res) => {
    let file = dialog.save_finish(res);
    const outputStream = file.replace(null, false, Gio.FileCreateFlags.NONE, null);

    const bytes = new GLib.Bytes(JSON.stringify(data));
    const bytesWritten = outputStream.write_bytes(bytes, null);

  })
}
