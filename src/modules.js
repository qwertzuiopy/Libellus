/* modules.js
 *
 * Copyright 2023 Luna
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
import Gdk from 'gi://Gdk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
import Pango from 'gi://Pango';

import { adapter, navigate } from "./window.js";

export const Card = GObject.registerClass({
  GTypeName: 'Card',
}, class extends Gtk.Box {
  constructor(title, content) {
    super({ css_classes: ["card"],
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 10,
      vexpand: false,
      valign: Gtk.Align.FILL, halign: Gtk.Align.FILL,
      width_request: 120
    });


    this.label = new Gtk.Label( {
      label: title,
      hexpand: true,
      margin_top: 20, margin_start: 15, margin_end: 15
    } );
    this.append(this.label);

    this.content = new Gtk.Label( {
      label: content,
      css_classes: ["title-4"],
      margin_bottom: 20, margin_start: 15, margin_end: 15,
      selectable: true
    } );
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
      valign: Gtk.Align.FILL,
      halign: Gtk.Align.FILL,
      width_request: 120,
    } );

    this.navigation_view = navigation_view;
    this.data = data;

    this.label = new Gtk.Label( {
      hexpand: true,
      label: title,
      margin_top: 20,
      margin_start: 20,
      margin_end: 15,
    } );
    this.append(this.label);

    this.content = new Gtk.Button( {
      label: content,
      margin_bottom: 20,
      margin_start: 15,
      margin_end: 15,
      css_classes: ["title-4", "accent"],
    } );
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

    this.get_child().ellipsize = Pango.EllipsizeMode.END;
    this.data = data;
    this.navigation_view = navigation_view;

    this.connect("clicked", () => {
      navigate(this.data, this.navigation_view);
    } );
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
      margin_top: 10, margin_start: 10, margin_end: 10, margin_bottom: 10,
      hexpand: true,
      selectable: true,
    });
    this.append(this.label);
  }
});

export const ModuleMultiText = GObject.registerClass({
  GTypeName: 'ModuleMultiText',
}, class extends Gtk.ListBox {
  constructor(label) {
    super({});
    this.add_css_class("boxed-list");
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
          hexpand: true,
          selectable: true,
        });
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
            hexpand: true,
            selectable: true,
          })
        });
      }
      if (listboxrow != null) this.append(listboxrow);
    }
  }
});


// Format for object:
// {
// desc: "content",
// desc2: "content2",
// }
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
          wrap: true,
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
}, class extends Gtk.ListBoxRow {
  constructor(label, stats) {
    super( { activatable: false, selectable: false } );
    this.child = new Gtk.Box( { } );
    this.child.append(new Gtk.Label( { css_classes: ["heading"], width_request: 100, label: label, hexpand: false, halign: Gtk.Align.START, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15 } ));
    this.child.append(new Gtk.Separator( { orientation: Gtk.Orientation.VERTICAL } ));
    let wrapbox = new Adw.WrapBox( {
      hexpand: true, line_spacing: 5, line_homogeneous: true, child_spacing: 5,
      margin_start: 5, margin_end: 5, margin_top: 5, margin_bottom: 5
    } );
    for (let i = 0; i < stats.length; i++) {
      wrapbox.append(new Gtk.Label( { wrap: true, label:stats[i] } ));
    }
    this.child.append(wrapbox);
  }
});

export const ModuleStatRow = GObject.registerClass({
  GTypeName: 'ModuleStatRow',
}, class extends Gtk.ListBoxRow {
  constructor(label) {
    super( { activatable: false, selectable: false } );
    this.child = new Gtk.Label( { label: label, halign: Gtk.Align.FILL, margin_top: 15, margin_bottom: 15, margin_start: 15, margin_end: 15, wrap: true } );
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
      ellipsize: Pango.EllipsizeMode.END,
      margin_top: 15, margin_bottom: 10 } ))
    stats = stats.map((i) => new Link(i, navigation_view));
    vbox.append(new Div(stats));
  }
});



export const Image = GObject.registerClass({
  GTypeName: 'Image',
}, class extends Adw.Bin {
  constructor(image) {
    super({});
    let response = adapter.get_any_sync(image);
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
  constructor(image, height = 300) {
    super( { css_classes: ["card"], halign: Gtk.Align.FILL, valign: Gtk.Align.FILL, vexpand: true, hexpand: true, height_request: height } );
    adapter.get_any_async(image, (response) => {
      this.halign = Gtk.Align.CENTER;
      this.valign = Gtk.Align.START;
      this.vexpand = false;
      let loader = new GdkPixbuf.PixbufLoader();
      loader.write_bytes(GLib.Bytes.new(response));
      loader.close();
      let img = new Gtk.Picture( { css_classes: ["card"] } );
      img.set_pixbuf(loader.get_pixbuf());

      let overlay = new Gtk.Overlay({child: img});

      let revealer = new Gtk.Revealer( { child: overlay, transition_type: Gtk.RevealerTransitionType.CROSSFADE } );
      this.set_child(revealer);
      revealer.set_reveal_child(true);

      let button = new Gtk.Button({
        css_classes:["osd", "circular"],
        icon_name: "view-fullscreen-symbolic",
        halign: Gtk.Align.END,
        valign: Gtk.Align.END,
        margin_bottom: 5,
        margin_end: 5 })
      button.connect("clicked", () => {
        let dataDir = GLib.get_user_config_dir();
        let name = image.split(".")[0];
        name = name.split("/").at(-1);
        let destination = GLib.build_filenamev([dataDir, name+'.jpeg']);
        loader.get_pixbuf().savev(destination, "jpeg", null, null);
        let file = Gio.File.new_for_path(destination);
        let launcher = new Gtk.FileLauncher({file:file});
        launcher.launch(null, null, null);
      });
      overlay.add_overlay(button);
    });
    let spinner = new Adw.Spinner( { halign: Gtk.Align.FILL, valign: Gtk.Align.FILL } );
    // spinner.start();
    this.set_child(new Adw.Bin({child: spinner, halign: Gtk.Align.FILL, hexpand: true}));
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
}, class extends Adw.WrapBox {
  constructor(cards) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.CENTER,
      hexpand: true,
      justify_last_line: Adw.JustifyMode.NONE,
      align: 0.5,
    });
    for (let i in cards) {
      this.append(cards[i]);
    }
  }
});

export const BigDiv = GObject.registerClass({
  GTypeName: 'BigDiv',
}, class extends Adw.WrapBox {
  constructor(cards) {
    super({
      orientation: Gtk.Orientation.HORIZONTAL,
      halign: Gtk.Align.CENTER,
      line_spacing: 10,
      child_spacing: 10,
      hexpand: true,
      justify_last_line: Adw.JustifyMode.NONE,
      align: 0.5,
    });
    for (let i in cards) {
      this.append(cards[i]);
    }
  }
});
