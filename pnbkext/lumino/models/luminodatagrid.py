from bokeh.models.layouts import HTMLBox
from bokeh.core.properties import Dict, String, Any, Enum, List, Int


class LuminoDataGrid(HTMLBox):

    json_data = Dict(String, Any)

    selection_mode = Enum('row', 'column', 'cell')

    selections = List(Dict(String, Any), default=[])

    row_header_width = Int(default=64)

    column_header_height = Int(default=32)
    
    row_height = Int(default=32)

    column_width = Int(default=128)

    gridstyle = Enum(
        'green',
        'blue',
        'brown',
        'none'
    )
