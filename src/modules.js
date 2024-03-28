/* modules.js
 *
 * Copyright 2023 Michael Hammer
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
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import Pango from 'gi://Pango';

import { navigate, get_sync, get_any_async } from "./window.js";

export const Card = GObject.registerClass({
  GTypeName: 'Card',
}, class extends Gtk.Box {
  constructor(title, content) {
    super({});

    this.orientation = Gtk.Orientation.VERTICAL;
    this.add_css_class("card");
    this.spacing = 10;
    this.vexpand = false;
    this.valign = Gtk.Align.CENTER;
    this.halign = Gtk.Align.CENTER;
    this.set_size_request(120, 0);

    this.label = new Gtk.Label();
    this.label.set_label(title); this.hexpand = true;
    this.label.margin_top = 20;
    this.label.margin_start = 15;
    this.label.margin_end = 15;
    this.append(this.label);

    this.content = new Gtk.Label();
    this.content.set_label(content);
    this.content.add_css_class("title-4");
    this.content.margin_bottom = 20;
    this.content.margin_start = 15;
    this.content.margin_end = 15;
    this.append(this.content);
  }
});

export const LinkCard = GObject.registerClass({
  GTypeName: 'LinkCard',
}, class extends Gtk.Box {
  constructor(title, content, data, navigation_view) {
    super( {
      orientation: Gtk.Orientation.VERTICAL,
      css_classes: ["card"],
      spacing: 10,
      vexpand: false,
      valign: Gtk.Align.CENTER,
      halign: Gtk.Align.CENTER,
      width_request: 120 } );

    this.navigation_view = navigation_view;
    this.data = data;

    this.label = new Gtk.Label( {
      hexpand: true,
      label: title,
      margin_top: 20,
      margin_start: 20,
      margin_end: 15 } );
    this.append(this.label);

    this.content = new Gtk.Button( {
      label: content,
      margin_bottom: 20,
      margin_start: 15,
      margin_end: 15,
      css_classes: ["title-4", "accent"] } );
    this.content.connect("clicked", () => {
      navigate(this.data, this.navigation_view);
    } );
    this.append(this.content);
  }
});


export const Link = GObject.registerClass({
  GTypeName: 'Link',
}, class extends Gtk.Button {
  constructor(data, navigation_view) {
    super({
      label: data.name,
      halign: Gtk.Align.CENTER,
      margin_bottom: 10,
      margin_start: 5,
      margin_end: 5,
      css_classes: ["heading", "accent"] });

    this.data = data;
    this.navigation_view = navigation_view;

    this.connect("clicked", () => {
      navigate(this.data, this.navigation_view);
    } );
  }
});





export const ModuleCardRow = GObject.registerClass({
  GTypeName: 'ModuleCardRow',
}, class extends Gtk.Box {
  constructor(cards) {
    super({});
    this.spacing = 20;
    this.cards = cards;
    for (let i in this.cards) {
      this.append(this.cards[i]);
    }
  }
});

export const ModuleTitle = GObject.registerClass({
  GTypeName: 'ModuleTitle',
}, class extends Gtk.Label {
  constructor(label, title) {
    super({ellipsize: Pango.EllipsizeMode.END});

    this.label = label;
    this.add_css_class("title-" + title);
  }
});

export const ModuleText = GObject.registerClass({
  GTypeName: 'ModuleText',
}, class extends Gtk.Box {
  constructor(label) {
    super({});
    this.add_css_class("card");
    this.label = new Gtk.Label({
      label: label,
      wrap: true,
      margin_top: 10,
      margin_start: 10,
      margin_end: 10,
      margin_bottom: 10,
      hexpand: true });
    this.append(this.label);
  }
});

export const ModuleMultiText = GObject.registerClass({
  GTypeName: 'ModuleMultiText',
}, class extends Gtk.ListBox {
  constructor(label) {
    super({});
    this.add_css_class("boxed-list");
    this.label = [];
    let table = null;
    for (let i in label) {
      if (label[i].split) label[i] = label[i].split("###");
    }
    label = label.flat();
    for (let i = 0; i < label.length; i++) {
      let listboxrow = null;
      if (label[i].includes("***")) {
        if (table != null) {
          this.append(new ModuleNTable(table));
          table = null;
        }
        let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
        let label1 = new Gtk.Label({
          label: label[i].slice(3, label[i].lastIndexOf("***") - 1),
          wrap: true,
          margin_top: 10, margin_start: 10, margin_end: 10,
          hexpand: true,
          css_classes: ["heading"] } );
        let label2 = new Gtk.Label({
          label: label[i].slice(label[i].lastIndexOf("***") + 3),
          wrap: true,
          margin_top: 5, margin_start: 10, margin_end: 10, margin_bottom: 10,
          hexpand: true });
        box.append(label1);
        box.append(label2);
        listboxrow = new Gtk.ListBoxRow({
          activatable: false, selectable: false,
          halign: Gtk.Align.FILL,
          child: box });
      } else if (label[i].includes("|")) {
        if (table == null) table = [];
        let s = label[i].split("|");
        s = s.filter( (i) => i != "" );
        if (!s[0].includes("---")) table.push(s);
      } else {
        if (table != null) {
          this.append(new Gtk.ListBoxRow( {
            child: new ModuleNTable(table),
            activatable: false, selectable: false } ));
          table = null;
        }
        listboxrow = new Gtk.ListBoxRow({
          activatable: false, selectable: false,
          halign: Gtk.Align.FILL,
          child: new Gtk.Label({
            label: label[i],
            wrap: true,
            margin_top: 15, margin_start: 10, margin_end: 10, margin_bottom: 15,
            hexpand: true })
          });
      }
      if (listboxrow != null) this.append(listboxrow);
    }
  }
});

export const Module2Table = GObject.registerClass({
  GTypeName: 'Module2Table',
}, class extends Gtk.Grid {
  constructor(object, first_desc, second_desc) {
    super({});
    this.add_css_class("card");
    this.attach(new Gtk.Label({
        label: first_desc,
        halign: Gtk.Align.CENTER,
        margin_top: 10, margin_bottom: 10 }),
      0, 0, 1, 1);
    this.attach(new Gtk.Label({
        label: second_desc,
        halign: Gtk.Align.CENTER,
        margin_top: 10, margin_bottom: 10 }),
      0, 2, 1, 1);

    this.attach(new Gtk.Separator({
        orientation: Gtk.Orientation.VERTICAL,
        halign: Gtk.Align.START }),
      1, 0, 1, 3);

    let counter = 2;
    for (let i in object) {
      this.attach(new Gtk.Label({
          label: i,
          halign: Gtk.Align.CENTER,
          margin_top: 10, margin_bottom: 10 }),
        counter, 0, 1, 1);
      this.attach(new Gtk.Label({
          label: object[i],
          halign: Gtk.Align.CENTER,
          margin_top: 10, margin_bottom: 10 }),
        counter, 2, 1, 1);
      counter++;
    }
    this.attach(new Gtk.Separator({
        orientation: Gtk.Orientation.HORIZONTAL,
        hexpand: true }),
      0, 1, counter, 1);

  }
});
export const ModuleNTable = GObject.registerClass({
  GTypeName: 'ModuleNTable',
}, class extends Gtk.Grid {
  constructor(n) {
    super( { halign: Gtk.Align.FILL, hexpand: true} );
    for (let i in n) {
      for (let j in n[i]) {
        let l = new Gtk.Label( {
          hexpand: true,
          label: n[i][j],
          margin_top: 10, margin_bottom: 10 } );
        if (i == 0) l.css_classes = ["heading"];
        this.attach(l, j*2, i*2, 1, 1);

        if (j < n[i].length-1)
          this.attach(new Gtk.Separator(), j*2+1, i*2, 1, 1);
        if (i < n.length-1)
          this.attach(new Gtk.Separator(), j*2, i*2+1, 1, 1);
      }
    }
  }
});


export const ModuleLinkList = GObject.registerClass({
  GTypeName: 'ModuleLinkList',
}, class extends Gtk.ListBox {
  constructor(label, navigation_view) {
    super({});
    this.add_css_class("boxed-list");
    this.label = label;
    for (let i = 0; i < label.length; i++) {
      let listboxrow = null;
      let data = label[i].item;
      listboxrow = new Adw.ActionRow({
        activatable: true, selectable: false,
        halign: Gtk.Align.FILL,
        title: data.name });

      listboxrow.connect("activated", () => {
        navigate(data, navigation_view);
      } );

      listboxrow.add_suffix(new Gtk.Image( {
          icon_name: "go-next-symbolic" } ));

      this.append(listboxrow);
    }
  }
});

export const ModuleStatListRow = GObject.registerClass({
  GTypeName: 'ModuleStatListRow',
}, class extends Adw.ActionRow {
  constructor(label, stats) {
    super( { title: label, activatable: false, selectable: false } );
    for (let i = 0; i < stats.length; i++) {
      if (label != "" || i!= 0) this.add_suffix(new Gtk.Separator());
      this.add_suffix(new Gtk.Label( {
        label: stats[i], css_classes: ["heading"] } ));
    }
  }
});
export const ModuleShortLinkListRow = GObject.registerClass({
  GTypeName: 'ModuleShortLinkListRow',
}, class extends Adw.ActionRow {
  constructor(label, stats, navigation_view) {
    super( { title: label, activatable: false, selectable: false } );
    for (let i = 0; i < stats.length; i++) {
      let l = new Link(stats[i], navigation_view);
      l.margin_top = 10;
      this.add_suffix(l);
    }
  }
});

export const ModuleLinkListRow = GObject.registerClass({
  GTypeName: 'ModuleLinkListRow',
}, class extends Gtk.ListBoxRow {
  constructor(label, stats, navigation_view) {
    super( { activatable: false, selectable: false } );
    let vbox = new Gtk.Box( { orientation: Gtk.Orientation.VERTICAL } );
    this.set_child(vbox);
    vbox.append(new Gtk.Label( {
      label: label,
      css_classes: ["heading"],
      margin_top: 15, margin_bottom: 10 } ))
    stats = stats.map((i) => new Link(i, navigation_view));
    vbox.append(new Div(stats));

    /*while (stats.length > 0) {
      let hbox = new Gtk.Box( { halign: Gtk.Align.CENTER } );
      vbox.append(hbox);
      for (let chars = 0; chars < 60;) {
        if (!stats[0]) break;
        hbox.append(new Link(stats[0], navigation_view));
        chars += stats[0].name.length;
        stats.splice(0, 1);
      }
    }*/
  }
});



export const Image = GObject.registerClass({
  GTypeName: 'Image',
}, class extends Adw.Bin {
  constructor(image) {
    super({});
    let response = get_any_sync(image);
    let loader = new GdkPixbuf.PixbufLoader()
    loader.write_bytes(GLib.Bytes.new(response))
    loader.close()
    let img = new Gtk.Picture( { css_classes: ["card"], halign: Gtk.Align.CENTER, valign: Gtk.Align.FILL, vexpand: true, height_request: 300 } );
    img.set_pixbuf(loader.get_pixbuf());
    this.set_child(img);
  }
});

export const ImageAsync = GObject.registerClass({
  GTypeName: 'ImageAsync',
}, class extends Adw.Bin {
  constructor(image) {
    super( { css_classes: ["card"], halign: Gtk.Align.CENTER, valign: Gtk.Align.FILL, vexpand: true, height_request: 400, width_request: 600 } );
    get_any_async(image, (response) => {
      let loader = new GdkPixbuf.PixbufLoader()
      loader.write_bytes(GLib.Bytes.new(response))
      loader.close()
      let img = new Gtk.Picture( { css_classes: ["card"] } );
      img.set_pixbuf(loader.get_pixbuf());

      let overlay = new Gtk.Overlay({child: img});

      let revealer = new Gtk.Revealer( { child: overlay, transition_type: Gtk.RevealerTransitionType.CROSSFADE } );
      this.set_child(revealer);
      revealer.set_reveal_child(true);
      this.width_request = -1;

      let button = new Gtk.Button({
        css_classes:["osd", "circular"],
        icon_name: "view-fullscreen-symbolic",
        halign: Gtk.Align.END,
        valign: Gtk.Align.END,
        margin_bottom: 5,
        margin_end: 5 })
      button.connect("clicked", () => {
        let dataDir = GLib.get_user_config_dir()
        let name = image.split(".")[0]
        name = name.split("/").at(-1)
        let destination = GLib.build_filenamev([dataDir, name+'.jpeg'])
        loader.get_pixbuf().savev(destination, "jpeg", null, null)
        let file = Gio.File.new_for_path(destination)
        let launcher = new Gtk.FileLauncher({file:file})
        launcher.launch(null, null, null)
      })
      overlay.add_overlay(button);


    });
    let spinner = new Gtk.Spinner( { halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER } );
    spinner.start();
    this.set_child(spinner);
  }
});



export const ModuleLevelRow = GObject.registerClass({
  GTypeName: 'ModuleLevelRow',
}, class extends Gtk.ListBoxRow {
  constructor(data, navigation_view) {
    super( {activatable: false, selectable: false } );
    let box = new Gtk.Box( {
      orientation: Gtk.Orientation.HORIZONTAL,
      valign: Gtk.Align.CENTER,
      vexpand: true
    } );
    this.set_child(box);
    box.append( new Gtk.Label( {
      label: data.level.toString(),
      margin_start: 15, margin_top: 15, margin_bottom: 15, margin_end: 15
    } ));
    let links = [];
    for(let i in data.features) {
      let l = new Link(data.features[i], navigation_view)
      l.margin_top = 10;
      links.push(l);
    }
    box.append(new Div(links));
  }
});





export const Div = GObject.registerClass({
  GTypeName: 'Div',
}, class extends Gtk.FlowBox {
  constructor(cards) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      max_children_per_line: 10,
      min_children_per_line: 1,
      selection_mode: Gtk.SelectionMode.NONE,
      // if halign is set to CENTER (which looks better) the FlowBox completely breaks for some reason
      halign: Gtk.Align.FILL,
      hexpand: true,
    });
    for (let i in cards) {
      this.append(cards[i]);
    }
  }
});
