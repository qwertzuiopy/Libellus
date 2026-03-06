libellus_sources = [
  'main.vala',
  'application.vala',
  'window.vala',
  'data.vala',
  'modules.vala',
  'searchpage.vala',
  'bookmarkmenu.vala',
  'filter_dialog.vala',
]

libellus_deps = [
  config_dep,
  dependency('gtk4'),
  dependency('gee-0.8'),
  dependency('gio-2.0'),
  dependency('libsoup-3.0'),
  dependency('libadwaita-1', version: '>= 1.4'),
]

blueprints = custom_target('blueprints',
  input: files(
    'shortcuts-dialog.blp',
    'window.blp',
    'page.blp',
    'tab.blp',
    'search_page.blp',
    'filter_dialog.blp',
    'filter_page.blp',
  ),
  output: '.',
  command: [find_program('blueprint-compiler'), 'batch-compile', '@OUTPUT@', '@CURRENT_SOURCE_DIR@', '@INPUT@'],
)

libellus_sources += gnome.compile_resources('libellus-resources',
  'libellus.gresource.xml',
  dependencies: blueprints,
  c_name: 'libellus'
)

executable('libellus', libellus_sources,
  vala_args: [
    '--gresourcesdir=src/',
  ],
  dependencies: libellus_deps,
  include_directories: config_inc,
  install: true,
)
