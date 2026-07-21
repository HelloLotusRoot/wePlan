@echo off  
:loop  
java -jar C:\workspace\wePlan\build\libs\wePlan-0.0.1-SNAPSHOT.jar  
echo Backend stopped. Restarting in 3s...  
timeout /t 3 /nobreak  
goto loop 
