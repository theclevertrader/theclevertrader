' =====================================================================
' THE CLEVER TRADER — HIDDEN PROCESS LAUNCHER
' Runs any command completely invisible (no window, no taskbar icon)
' Usage: wscript run_hidden.vbs "command to run" "working_directory"
' =====================================================================
Set WshShell = CreateObject("WScript.Shell")

Dim cmd, workDir
cmd = WScript.Arguments(0)

If WScript.Arguments.Count > 1 Then
    workDir = WScript.Arguments(1)
    WshShell.CurrentDirectory = workDir
End If

' 0 = Hidden window, False = Don't wait for completion
WshShell.Run cmd, 0, False
