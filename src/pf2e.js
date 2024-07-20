
/* pf2e.js
 *
 * Copyright 2024 Michael Hammer
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
import { ResultPage, SearchResult } from "./results.js";
import { Card, BigDiv } from "./modules.js";
import { API } from "./api_pf2e.js";


export const ident = "pf2e";

export const ModuleDescription = GObject.registerClass({
  GTypeName: 'ModuleDescription',
}, class extends Gtk.ListBox {
  constructor(data) {
    super({ css_classes: ["boxed-list"] });
    for (let i in data) {
      if (data[i].type == "text") {
        this.append(new Gtk.ListBoxRow({
          activatable: false, selectable: false,
          halign: Gtk.Align.FILL,
          child: new Gtk.Label({
            label: data[i].text,
            wrap: true,
            margin_top: 15, margin_start: 10, margin_end: 10, margin_bottom: 15,
            hexpand: true,
            selectable: true,
            use_markup: true,
          }),
        }));
      }
    }
  }
});

export const SearchResultPageSpell = GObject.registerClass({
  GTypeName: 'SearchResultPageSpell',
}, class extends ResultPage {
  constructor(data, navigation_view) {
    super(data, navigation_view);
    let cards = [];
    cards.push(new Card("Level", this.data.system.level.value + ""));

    this.wrapper.append(new BigDiv(cards));

    this.wrapper.append(new ModuleDescription(this.data.system.description.value));
  }
});

export const get_search_results = (results) => {
  results = results.concat(get_sync("Compendium.pf2e.spells").map((a) => new SearchResult(a)));
  return results;
}

export const resolve_link = (data, navigation_view) => {
  var page_data = get_sync(data.url);
  var page = null;
  page = new SearchResultPageSpell(page_data, navigation_view);
  return page;
}

export const get_sync = (url) => {
  let parts = url.split(".");
  let category = parts[2];
  if (parts.length == 5) {
    let item = parts[4].replace(" ", "-").toLowerCase();
    return API[category][item];
  } else if (parts.length == 3) {
    return Object.values(API[category]);
  }

}

export const get_any_sync = (_url) => {
  return null;
}

export const get_any_async = (_url, callback) => {
  callback(null);
}



export const filter_options = {
}
