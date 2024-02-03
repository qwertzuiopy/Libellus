pkgdatadir = join_paths(get_option('datadir'), meson.project_name())
gnome = import('gnome')

src_res = gnome.compile_resources('io.github.qwertzuiopy.Questscribe.src',
  'io.github.qwertzuiopy.Questscribe.src.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

data_res = gnome.compile_resources('io.github.qwertzuiopy.Questscribe.data',
  'io.github.qwertzuiopy.Questscribe.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

bin_conf = configuration_data()
bin_conf.set('GJS', find_program('gjs').full_path())
bin_conf.set('PACKAGE_VERSION', meson.project_version())
bin_conf.set('PACKAGE_NAME', meson.project_name())
bin_conf.set('prefix', get_option('prefix'))
bin_conf.set('libdir', join_paths(get_option('prefix'), get_option('libdir')))
bin_conf.set('datadir', join_paths(get_option('prefix'), get_option('datadir')))
bin_conf.set('resource_path', '/io/github/qwertzuiopy/Questscribe')

configure_file(
  input: 'io.github.qwertzuiopy.Questscribe.in',
  output: 'io.github.qwertzuiopy.Questscribe',
  configuration: bin_conf,
  install: true,
  install_dir: get_option('bindir')
)
