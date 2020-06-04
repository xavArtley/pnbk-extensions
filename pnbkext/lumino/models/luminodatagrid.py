from bokeh.models.layouts import HTMLBox
from bokeh.core.properties import Dict, String, Any

class LuminoDataGrid(HTMLBox):

    json_data = Dict(String, Any)

    title = String(default="DataTable")
