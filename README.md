# Libellus

![Screenshot from 2024-04-04 19-45-22](https://github.com/qwertzuiopy/Libellus/assets/89102209/5b19aa2b-1231-435a-9a94-918889a97311)

<a href='https://flathub.org/apps/de.hummdudel.Libellus'> <img width='240' alt='Get it on Flathub' src='https://flathub.org/api/badge?locale=en'/> </a>

A simple DnD content viewer app.
It uses https://www.dnd5eapi.co/ as a database and simply displays the information.
But because making an http request every time is to slow a local copy of the database is shiped instead (Images are still downloaded though).

The easiest way to test the app is to clone this repository and open it in Gnome Builder.
Alternatively you can run "meson build && ninja -C build && sudo ninja -C build install" to install the app locally.

Other sources than the Player's Handbook can also be added / viewed in the app, please see https://github.com/qwertzuiopy/LibellusSources.

Dependencies are Gtk4 and Libadwaita.

NOTE: This project is not finished, there will be bugs.
If you have any suggestions or found any bugs, feel free to open an issue or a merge request, help is greatly appreciated!
