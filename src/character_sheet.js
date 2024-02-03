

import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import GdkPixbuf from 'gi://GdkPixbuf';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';
// for some reason this doesn't work
// import { Tab } from "./window.js";
import { score_to_modifier } from "./window.js";
const Tab = GObject.registerClass({
  GTypeName: 'Tab2',
}, class extends Adw.NavigationPage {
  constructor() {
    super({});
  }
});
const Draggable = GObject.registerClass({
  GTypeName: 'Draggable',
}, class extends Gtk.Box {
  constructor(label, short) {
    super( {
      css_classes: ["card"],
      halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
      orientation: Gtk.Orientation.VERTICAL,
      margin_top: 15, margin_bottom: 15,
      spacing: 5,
      height_request: 118 } );
    this.short = short;
    this.modifiers = new Gtk.Box();
    this.append(this.modifiers);

    let drag_x;
    let drag_y;

    this.drag = new Gtk.DragSource();
    this.drag.connect("prepare", (_source, x, y) => {
      drag_x = x;
      drag_y = y;
      const value = new GObject.Value();
      value.init(Gtk.Box);
      value.set_object(this);
      return Gdk.ContentProvider.new_for_value(value);
    });

    this.drag.connect("drag-begin", (_source, drag) => {
      const drag_widget = new Adw.Bin( {
        css_classes: ["card"],
        margin_start: 5, margin_top: 5, margin_end: 5, margin_bottom: 5} );

      drag_widget.set_size_request(100, 30);
      drag_widget.child = new Gtk.Label( { label: short } );

      const icon = Gtk.DragIcon.get_for_drag(drag);
      icon.child = drag_widget;

      drag.set_hotspot(drag_x, drag_y);
    });

    this.add_controller(this.drag);



    this.drop = Gtk.DropTarget.new(Gtk.Box, Gdk.DragAction.COPY);
    this.drop.connect("accept", (data) => { log(data); return true; } );
    this.drop.connect("drop", (_, data, x, y) => { log("------------------"); log(data); log(x); log(y); return true; } );
    this.add_controller(this.drop);
  }
});


const StatCard = GObject.registerClass({
  GTypeName: 'StatCard',
}, class extends Draggable {
  constructor(name, value) {
    super(name, name);

    let check = Gtk.CheckButton.new_with_label(name);
    check.css_classes = ["flat"];
    check.margin_top = 10;
    check.halign = Gtk.Align.CENTER;
    check.valign = Gtk.Align.CENTER;
    this.append(check);
    let modifier = new Gtk.Label( { css_classes: ["title-1"], label: score_to_modifier(value) } );
    this.append(modifier);
    let spin = new Gtk.SpinButton( {
      adjustment: new Gtk.Adjustment( { lower: 1, upper: 20, step_increment: 1, value: value } ),
      margin_start: 5, margin_end: 5, margin_bottom: 5,
      css_classes: ["flat"] } );
    spin.connect("notify::value", () => { modifier.label = score_to_modifier(spin.value); });
    this.append(spin);
  }
});

const Value = GObject.registerClass({
  GTypeName: 'Value',
}, class extends Draggable {
  constructor(name, value, lower, upper, step) {
    super( {  } );
    let label = new Gtk.Label( { margin_top: 10, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER, label: name } );
    this.append(label);
    let spin = new Gtk.SpinButton( {
      adjustment: new Gtk.Adjustment( { lower: lower, upper: upper, step_increment: step, value: value } ),
      margin_start: 5, margin_end: 5, margin_bottom: 5,
      valign: Gtk.Align.CENTER,
      css_classes: ["flat"] } );
    spin.connect("notify::value", () => { modifier.label = score_to_modifier(spin.value); });
    this.append(spin);
  }
});

export const SheetTab = GObject.registerClass({
  GTypeName: 'SheetTab',
}, class extends Tab {
  constructor(applied_filters, navigation_view) {
    super({});
    setTimeout(() => { this.navigation_view.tab_page.set_title("Character Sheet"); }, 1);
    this.navigation_view = navigation_view;
    this.set_hexpand(true)
    this.navigation_view.append(this);

    this.scrolled_window = new Gtk.ScrolledWindow();
    this.scrolled_window.set_halign(Gtk.Align.FILL);
    this.scrolled_window.set_hexpand(true);
    this.scrolled_window.set_size_request(400, 0);

    this.scrolled_window.add_css_class("undershoot-top");
    this.scrolled_window.add_css_class("undershoot-bottom");

    this.append(this.scrolled_window);

    this.back_wrapper = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    this.scrolled_window.set_child(this.back_wrapper);

    this.pin = new Gtk.Button({
      icon_name: "view-pin-symbolic",
      halign: Gtk.Align.END, hexpand: true,
      margin_top: 20, margin_end: 20 });
    // if (this.navigation_view.tab_page.pinned) this.pin.add_css_class("success");
    this.pin.connect("clicked", () => {
      this.navigation_view.tab_view.set_page_pinned(this.navigation_view.tab_page, !this.navigation_view.tab_page.pinned);
      if (this.navigation_view.tab_page.pinned) this.pin.set_css_classes(["success"]);
      else this.pin.set_css_classes([]);
    } );


    this.bar = new Gtk.Box();
    this.back_wrapper.append(this.bar);

    this.back = new Gtk.Button({ icon_name: "go-previous-symbolic", halign: Gtk.Align.START, margin_top: 20, margin_start: 20 });
    this.bar.append(this.back);
    this.bar.append(this.pin);
    this.back.connect("clicked", () => {
      if (!this.navigation_view.can_navigate_back) return;
      this.navigation_view.navigate(Adw.NavigationDirection.BACK);
      setTimeout(() => { this.navigation_view.remove(this); }, 1000);
    });


    this.back_wrapper.append(new StatCard("Strength", 10));
    this.back_wrapper.append(new StatCard("Dexterity", 17));
    this.back_wrapper.append(new StatCard("Constitution", 15));
    this.back_wrapper.append(new StatCard("Intelligence", 12));
    this.back_wrapper.append(new StatCard("Wisdom", 12));
    this.back_wrapper.append(new StatCard("Charisma", 20));

    this.back_wrapper.append(new Value("Armor Class", 14, 0, 50, 1));
  }
});
