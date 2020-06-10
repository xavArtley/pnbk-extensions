import sys
import param
import numpy as np
from pyviz_comms import JupyterComm
from panel.layout.base import ListPanel
from panel.pane.base import PaneBase
from ..models import (LuminoDataGrid as _BkLuminoDataGrid,
                      LuminoDock as _BkLuminoDock)


class LuminoDataGrid(PaneBase):

    json_data = param.Dict()

    selections = param.List(default=[])

    selection_mode = param.ObjectSelector(
        default='row',
        objects=['row', 'column', 'cell']
    )

    row_header_width = param.Integer(default=64, bounds=(0, None))

    column_header_height = param.Integer(default=32, bounds=(0, None))

    row_height = param.Integer(default=32, bounds=(0, None))

    column_width = param.Integer(default=128, bounds=(0, None))

    gridstyle = param.ObjectSelector(
        default='green',
        objects=['green', 'blue', 'brown', 'none']
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
        self._link_props(model,
                         ['json_data', 'selections', 'selection_mode',
                          'row_header_width', 'column_header_height',
                          'row_height', 'column_width'],
                         doc, root, comm)
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


class LuminoDock(ListPanel):
    """
    Horizontal layout of Viewables.
    """

    _rename = {'name': None, 'objects': 'children',
               'dynamic': None, 'active': None}

    _linked_props = []

    _bokeh_model = _BkLuminoDock

    __available_insert_modes = ["split-top",  "split-left",
                                "split-right", "split-bottom", "tab-before", "tab-after"]

    def __init__(self, *objects, **params):
        from panel.pane import panel
        if objects:
            if 'objects' in params:
                raise ValueError("A %s's objects should be supplied either "
                                 "as positional arguments or as a keyword, "
                                 "not both." % type(self).__name__)
            params['objects'] = []
            self._names = []
            self._insert_mode = []
            self._refs = []
            for idx, obj in enumerate(objects):
                assert len(obj) >= 2
                self._names.append(obj[0])
                params['objects'].append(panel(obj[1]))
                insert_mode = obj[2] if len(obj) > 2 else "tab-after"
                assert insert_mode in self.__available_insert_modes
                self._insert_mode.append(insert_mode)
                if len(obj) > 3:
                    ref = obj[3]
                    assert ref < idx
                else:
                    ref = None
                self._refs.append(ref)

        super(LuminoDock, self).__init__(**params)

    def _process_param_change(self, params):
        if 'objects' in params:
            params['children'] = [(name, pane, insert_mode, ref) for name, pane, insert_mode, ref in zip(
                self._names, params['objects'], self._insert_mode, self._refs)]
            del params['objects']

        params = super(LuminoDock, self)._process_param_change(params)

        return params
