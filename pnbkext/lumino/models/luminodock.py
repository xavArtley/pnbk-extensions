from bokeh.models.layouts import HTMLBox, LayoutDOM
from bokeh.core.properties import List, Instance, String, Tuple

class LuminoDock(HTMLBox):
    children = List(Tuple(String, Instance(LayoutDOM)))
