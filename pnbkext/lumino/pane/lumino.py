import sys
import param
import numpy as np
from pyviz_comms import JupyterComm
from panel.pane.base import PaneBase
from ..models import LuminoDataGrid as _BkLuminoDataGrid


class LuminoDataGrid(PaneBase):

    json_data = param.Dict()

    selections = param.List(default=[])

    selection_mode = param.ObjectSelector(
        default='row',
        objects=['row', 'column', 'cell']
    )

    _rename = {'object': None}

    def __init__(self, object=None, **params):
        params.update({'json_data': self._convert_dataframe(object)})
        super(LuminoDataGrid, self).__init__(object, **params)

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
        """
        Should return the bokeh model to be rendered.
        """
        if 'pnbkext.lumino.models' not in sys.modules:
            if isinstance(comm, JupyterComm):
                self.param.warning('Lumino models were not imported on instantiation '
                                   'and may not render in a notebook. Restart '
                                   'the notebook kernel and ensure you import Lumino'
                                   'panes before calling pn.extension()')

        props = self._process_param_change(self._init_properties())
        model = _BkLuminoDataGrid(**props)
        if root is None:
            root = model
        self._link_props(model, ['json_data', 'selections', 'selection_mode'], doc, root, comm)
        self._models[root.ref['id']] = (model, parent)
        return model

    def _init_properties(self):
        return {k: v for k, v in self.param.get_param_values()
                if v is not None and k not in [
                    'default_layout', 'object'
                ]}

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
            primaryKey=[index_name],
            fields=[{"name": col, "type": self._get_js_type(df_reset.dtypes[col])}
                    for col in df_reset.columns]
        )
        return dict(data=data, schema=schema)

    def _update(self, model=None):
        self.json_data = self._convert_dataframe(self.object)
        if model is not None:
            model.json_data = self.json_data