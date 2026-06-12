import pandas as pd
from pathlib import Path
from collections import defaultdict
from zipfile import ZipFile, ZIP_DEFLATED
from datetime import datetime
import sys

args = sys.argv

EXCEL_FILE = args[1]
OUTPUT_DIR = "generated_project"

def write_log(message):
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {message}")

def create_project():
    df = pd.read_excel(EXCEL_FILE)

    required_columns = {
        "FILE_PATH",
        "FILE_TYPE",
        "PART",
        "CONTENT"
    }

    missing = required_columns - set(df.columns)

    if missing:
        raise ValueError(
            f"Excelに必要な列がありません: {missing}"
        )

    output_root = Path(OUTPUT_DIR)
    output_root.mkdir(exist_ok=True)

    files = defaultdict(list)

    for _, row in df.iterrows():

        file_path = str(row["FILE_PATH"]).strip()

        if not file_path:
            continue

        file_type = str(row["FILE_TYPE"]).strip().lower()

        part = row["PART"]

        content = ""

        if pd.notna(row["CONTENT"]):
            content = str(row["CONTENT"])
            content = content.replace("<<NL>>", "\n")
            content = content.replace("<TAB>>", "\t")

        target = output_root / file_path

        if file_type == "dir":

            target.mkdir(
                parents=True,
                exist_ok=True
            )

            write_log(f"フォルダ作成: {file_path}")

        elif file_type == "file":

            files[file_path].append(
                (
                    int(part),
                    content
                )
            )

    for file_path, parts in files.items():

        parts.sort(key=lambda x: x[0])

        merged_content = "".join(
            content
            for _, content in parts
        )

        target = output_root / file_path

        target.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            target,
            "w",
            encoding="utf-8",
            newline=""
        ) as f:

            f.write(merged_content)

        write_log(f"ファイル作成: {file_path}")

    write_log("生成完了")

def create_zip():
    zip_name = f"{OUTPUT_DIR}.zip"

    with ZipFile(
        zip_name,
        "w",
        ZIP_DEFLATED
    ) as zipf:

        for file in Path(OUTPUT_DIR).rglob("*"):

            if file.is_file():

                zipf.write(
                    file,
                    file.relative_to(OUTPUT_DIR)
                )

    write_log(f"ZIP作成: {zip_name}")

def create_readme_if_missing():
    readme = Path(OUTPUT_DIR) / "README.md"

    if not readme.exists():

        readme.write_text(
            "# Generated Project\n",
            encoding="utf-8"
        )

        write_log("README.md自動生成")

if __name__ == "__main__":
    create_project()
    create_readme_if_missing()
    create_zip()
    write_log("すべて完了")
