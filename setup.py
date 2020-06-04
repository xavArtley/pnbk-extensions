#!/usr/bin/env python

import os
import shutil
import sys
import json

from setuptools import setup, find_packages
from setuptools.command.develop import develop
from setuptools.command.install import install
from setuptools.command.sdist import sdist

def _build_js():
    from bokeh.ext import build
    print("Building custom models:")
    package_dir = os.path.join(os.path.dirname(__file__), "pnbkext")
    build(package_dir)


class CustomDevelopCommand(develop):
    """Custom installation for development mode."""

    def run(self):
        _build_js()
        develop.run(self)


class CustomInstallCommand(install):
    """Custom installation for install mode."""

    def run(self):
        _build_js()
        install.run(self)


class CustomSdistCommand(sdist):
    """Custom installation for sdist mode."""

    def run(self):
        _build_js()
        sdist.run(self)


_COMMANDS = {
    'develop': CustomDevelopCommand,
    'install': CustomInstallCommand,
    'sdist':   CustomSdistCommand,
}

try:
    from wheel.bdist_wheel import bdist_wheel

    class CustomBdistWheelCommand(bdist_wheel):
        """Custom bdist_wheel command to force cancelling qiskit-terra wheel
        creation."""

        def run(self):
            """Do nothing so the command intentionally fails."""
            _build_js()
            bdist_wheel.run(self)

    _COMMANDS['bdist_wheel'] = CustomBdistWheelCommand
except Exception:
    pass


setup(
    name='pnbkext',
    version="0.0.1",
    cmdclass=_COMMANDS,
    packages=find_packages(),
)