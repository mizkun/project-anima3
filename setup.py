from setuptools import setup, find_packages

setup(
    name="project_anima",
    version="0.1.0",
    description="AI Character Simulator",
    author="Project Anima Team",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    include_package_data=True,
    install_requires=[
        "pydantic>=2.0.0",
        "pyyaml>=6.0",
        "google-generative-ai>=0.3.0",
        "python-dotenv>=1.0.0",
        "langgraph>=0.0.19",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "pre-commit>=3.3.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "project-anima=src.project_anima.cli:main",
        ],
    },
)
