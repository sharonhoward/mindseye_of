source("./src/data/shared.R") 
source("./src/data/r_cheshire_petitions.R")
# ~/r_projects/learning-code/observablejs/obf/src/data/r_addhealth.R

## make a zip even if you only have one file to start with
# Add to zip archive, write to stdout
setwd(tempdir())
write_csv(cheshire_petitions, "cheshire-petitions.csv")
system("zip - -r .")  
