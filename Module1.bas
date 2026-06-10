Attribute VB_Name = "Module1"
Option Explicit

Sub GenerateProject()

Dim ws As Worksheet
Dim logWs As Worksheet
Dim lastRow As Long
Dim i As Long

Dim basePath As String
Dim filePath As String
Dim fileType As String
Dim content As String

Dim dict As Object
Dim fso As Object

Set ws = ActiveSheet

basePath = ThisWorkbook.Path & "\generated_project"

Set dict = CreateObject("Scripting.Dictionary")
Set fso = CreateObject("Scripting.FileSystemObject")

If Dir(basePath, vbDirectory) = "" Then
    MkDir basePath
End If

On Error Resume Next

Set logWs = Worksheets("LOG")

If logWs Is Nothing Then
    Worksheets.Add After:=Worksheets(Worksheets.Count)
    ActiveSheet.Name = "LOG"
    Set logWs = Worksheets("LOG")
End If

logWs.Cells.Clear

logWs.Range("A1") = "日時"
logWs.Range("B1") = "対象"
logWs.Range("C1") = "結果"

On Error GoTo 0

lastRow = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row

For i = 2 To lastRow

    filePath = Trim(ws.Cells(i, 1).Value)
    fileType = LCase(Trim(ws.Cells(i, 2).Value))
    content = ws.Cells(i, 4).Value

    If filePath = "" Then GoTo NextRow

    If fileType = "dir" Then

        CreateFolderRecursive basePath & "\" & filePath

        WriteLog logWs, filePath, "フォルダ作成"

    ElseIf fileType = "file" Then

        If dict.Exists(filePath) Then
            dict(filePath) = dict(filePath) & vbCrLf & content
        Else
            dict.Add filePath, content
        End If

    End If

NextRow:
Next i

Dim key As Variant

For Each key In dict.Keys

    SaveUtf8File _
        basePath & "\" & key, _
        dict(key)

    WriteLog logWs, key, "ファイル作成"

Next key

MsgBox "プロジェクト生成完了", vbInformation

End Sub

Private Sub CreateFolderRecursive(ByVal folderPath As String)

Dim parts() As String
Dim currentPath As String
Dim i As Long

parts = Split(folderPath, "\")

currentPath = parts(0)

For i = 1 To UBound(parts)

    currentPath = currentPath & "\" & parts(i)

    If Dir(currentPath, vbDirectory) = "" Then
        MkDir currentPath
    End If

Next i

End Sub

Private Sub SaveUtf8File( _
ByVal fileName As String, _
ByVal content As String)

Dim stream As Object
Dim folderPath As String

folderPath = Left(fileName, InStrRev(fileName, "\") - 1)

CreateFolderRecursive folderPath

Set stream = CreateObject("ADODB.Stream")

stream.Type = 2
stream.Charset = "utf-8"
stream.Open

stream.WriteText content

stream.SaveToFile fileName, 2

stream.Close

End Sub

Private Sub WriteLog( _
ByVal ws As Worksheet, _
ByVal target As String, _
ByVal result As String)

Dim r As Long

r = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row + 1

ws.Cells(r, 1) = Now
ws.Cells(r, 2) = target
ws.Cells(r, 3) = result

End Sub


