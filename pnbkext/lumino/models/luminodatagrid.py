from bokeh.models.layouts import HTMLBox
from bokeh.core.properties import Dict, String, Any, Enum, List

class LuminoDataGrid(HTMLBox):

    json_data = Dict(String, Any)

    selection_mode = Enum('row', 'column', 'cell')

    selections = List(Dict(String, Any), default=[])
