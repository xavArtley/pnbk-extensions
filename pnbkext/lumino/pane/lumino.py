import param
import numpy as np
from panel.pane.markup import DivPaneBase
from ..models.luminodatagrid import LuminoDataGrid as _BkLuminoDataGrid

class LuminoDataGrid(DivPaneBase):

    title = param.String(default="DataTable")

    _rename = {'object': None}

    _bokeh_model = _BkLuminoDataGrid

    @classmethod
    def applies(cls, obj):
        module = getattr(obj, '__module__', '')
        name = type(obj).__name__
        if (any(m in module for m in ('pandas',)) and
            name in ('DataFrame',)):
            return True
        else:
            return False

    def _get_model(self, doc, root=None, parent=None, comm=None):
        return super(LuminoDataGrid, self)._get_model(doc, root, parent, comm)

    def _get_js_type(self, dtype):
        if np.issubdtype(dtype, np.integer):
            return "integer"
        elif np.issubdtype(dtype, np.number):
            return "number"
        else:
            return "string"

    def _convert_dataframe(self, df):
        if df.index.name is None:
            index_name = "index"
        else:
            index_name = df.index.name
        df_reset = df.reset_index()
        data = df_reset.to_dict(orient='records')
        schema = dict(
            primaryKey = [index_name],
            fields = [{"name": col, "type":self._get_js_type(df_reset.dtypes[col])} 
                    for col in df_reset.columns]
        )
        return dict(data=data, schema=schema)

    def _get_properties(self):
        props = super(LuminoDataGrid, self)._get_properties()
        props.update({"json_data": self._convert_dataframe(self.object),
                      "title": self.title})
        return props
