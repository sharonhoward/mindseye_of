source("./src/data/shared.R") 

burials <- read_csv("./src/data/westmr_burials.csv")

source("./src/data/r_inquests.R") 

# Add to zip archive, write to stdout
setwd(tempdir())
write_csv(inquests, "inquests.csv")
#write_csv(parishes, "parishes-count.csv")
#write_csv(monthly_inquests, "monthly-inquests.csv")
#write_csv(burials_monthly_p5, "burials-monthly-p5.csv")
write_csv(burials_totals, "burials-totals.csv")
system("zip - -r .")  
