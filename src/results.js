/* results.js
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

import { make_manifest, unmake_manifest, score_to_modifier, bookmarks, toggle_bookmarked, is_bookmarked, save_state, adapter } from "./window.js";
import { ModuleTitle } from "./modules.js";

export const SearchResult = GObject.registerClass({
  GTypeName: 'SearchResult',
}, class extends Gtk.ListBoxRow {
  constructor(data, type) {
    super({});
    this.data = data;
    this.type = type;

    this.child = new Gtk.Box();
    let front = new Gtk.Box( { margin_start: 15, margin_top: 10, margin_bottom: 5, halign: Gtk.Align.START, hexpand: true, orientation: Gtk.Orientation.VERTICAL } );
    this.child.append(front);
    front.append(new Gtk.Label( { ellipsize: Pango.EllipsizeMode.END, css_classes: ["title"], halign: Gtk.Align.START, label: this.data.name }));
    if (adapter.ident == "dnd5e") {
      front.append(new Gtk.Label( { ellipsize: Pango.EllipsizeMode.END, css_classes: ["subtitle"], halign: Gtk.Align.START, label: this.data.url
        .split("/")[2]
        .split("-")
        .map((str) => { return str.charAt(0).toUpperCase() + str.slice(1); } )
        .join(" ") } ));
    } else if (adapter.ident == "pf2e") {
      front.append(new Gtk.Label( { ellipsize: Pango.EllipsizeMode.END, css_classes: ["subtitle"], halign: Gtk.Align.START, label: this.data.url } ));
    }

    // for searching
    this.name = this.data.name;

    this.child.append(new Gtk.Image( { halign: Gtk.Align.END, iconName: "go-next-symbolic", margin_end: 15 } ));
    this.set_activatable(true);

  }
});

export const ResultPage = GObject.registerClass({
  GTypeName: 'ResultPage',
}, class extends Gtk.ScrolledWindow {
  constructor(data, navigation_view) {
    super({
      halign: Gtk.Align.FILL,
      hexpand: true,
      hscrollbar_policy: Gtk.PolicyType.NEVER });

    this.navigation_view = navigation_view;

    this.data = data;

    this.bookmark_accel = () => {
      if (toggle_bookmarked ({ name: this.data.name, url: this.data.url })) {
        this.pin.set_css_classes(["success"]);
      } else {
        this.pin.set_css_classes([]);
      }
    }

    this.back_wrapper = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    this.set_child(this.back_wrapper);

    this.pin = new Gtk.Button({
      icon_name: "star-large-symbolic",
      halign: Gtk.Align.END, hexpand: true,
      margin_top: 20, margin_end: 20 });

    if (is_bookmarked ({ name: this.data.name, url: this.data.url })) {
      this.pin.add_css_class("success");
    }
    this.pin.connect("clicked", () => {
      if (toggle_bookmarked ({ name: this.data.name, url: this.data.url })) {
        this.pin.set_css_classes(["success"]);
      } else {
        this.pin.set_css_classes([]);
      }
    } );

    this.bar = new Gtk.Box( {
      orientation: Gtk.Orientation.HORIZONTAL,
      hexpand: true,
      halign:Gtk.Align.FILL } );

    this.bar.append(this.pin);
    this.back_wrapper.append(this.bar);

    this.clamp = new Adw.Clamp({
      maximum_size: 800,
      margin_start: 20, margin_end: 20, margin_bottom: 20 });
    this.back_wrapper.append(this.clamp);
    this.wrapper = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 20 });
    this.clamp.add_css_class("undershoot-top");
    this.clamp.add_css_class("undershoot-bottom");
    this.clamp.set_child(this.wrapper);

    if (this.data.full_name) {
      this.wrapper.append(new ModuleTitle(this.data.full_name, 1));
    } else {
      this.wrapper.append(new ModuleTitle(this.data.name, 1));
    }

    this.update_title = () => {
      this.navigation_view.tab_page.set_title(this.data.name);
    }
    this.update_title();
  }
});


