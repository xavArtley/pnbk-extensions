from bokeh.models.layouts import HTMLBox, LayoutDOM
from bokeh.core.properties import List, Instance, String, Tuple, Either, Enum, Int


InsertMode = Enum("split-top",  "split-left", "split-right",
                  "split-bottom", "tab-before", "tab-after", default="tab-after")


class LuminoDock(HTMLBox):
    children = List(
        Either(
            Tuple(String, Instance(LayoutDOM)),
            Tuple(String, Instance(LayoutDOM), InsertMode),
            Tuple(String, Instance(LayoutDOM), InsertMode, Int)
        ),
        default=[]
    )

