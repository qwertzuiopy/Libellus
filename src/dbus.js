import Gio from 'gi://Gio';
import {new_tab_from_data} from "./window.js";


export const DBUS = class {

  constructor() {

    const interfaceXml = `
      <node>
        <interface name="io.qwertzuiopy.Libellus">
          <method name="navigate">
            <arg type="s" direction="in" name="input"/>
          </method>
        </interface>
      </node>`;

    let serviceInstance;
    let exportedObject;
    this.onBusAcquired = (connection, name) => {
      console.log(`${name}: connection acquired`);
      // Create the class instance, then the D-Bus object
      serviceInstance = new Service();
      exportedObject = Gio.DBusExportedObject.wrapJSObject(interfaceXml, serviceInstance);

      // Assign the exported object to the property the class expects, then export
      serviceInstance._impl = exportedObject;
      exportedObject.export(connection, '/io/github/qwertzuiopy/Libellus/View');
    }
    this.onNameAcquired = (connection, name) => {
      console.log(`${name}: name acquired`);
    }
    this.onNameLost = (connection, name) => {
      console.log(`${name}: name lost`);
    }
    const ownerId = Gio.bus_own_name(
        Gio.BusType.SESSION,
        'io.github.qwertzuiopy.Libellus',
        Gio.BusNameOwnerFlags.NONE,
        this.onBusAcquired,
        this.onNameAcquired,
        this.onNameLost);
  }
};

class Service {
  navigate(arg) {
    new_tab_from_data({url:arg});
    console.log('navigation to '+arg+' invoked via dbus');
  }
}
