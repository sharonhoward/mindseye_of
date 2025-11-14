library(mindseyedata)

# in the data loader because reasons
#burials <- read_csv("./src/data/westmr_burials.csv")

burials_annual <-
burials |>
  group_by(parish, year) |>
  summarise(burials = sum(countn), .groups = "drop_last") |>
  ungroup()

burials_totals <-
burials |>
  group_by(parish) |>
  summarise(burials = sum(countn)) |>
  ungroup()


burials_monthly <-
burials |>
  group_by(parish, year, month) |>
  summarise(burials = sum(countn), .groups = "drop_last") |>
  ungroup()

burials_monthly_p5 <-
burials_monthly |>
  # 5 year periods
  mutate(p5 = glue("{year - (year %% 5)}-{year - (year %% 5)+4}")) |>
  #mutate(p5 = year -(year %% 5)) |>
  group_by(parish, p5, month) |>
  summarise(burials = sum(burials), .groups = "drop_last") |>
  ungroup()


inquests <-
coroners |> 
  select(id=rowid, doc_date, parish, the_deceased, gender, verdict, cause_of_death, deceased_additional_info)|>
  mutate(across(where(is.character ), ~na_if(., "") )) |>
  # simplify additional info
  mutate(deceased_additional_info = case_when(
    deceased_additional_info %in% c("child", "new born child") ~ deceased_additional_info,
    str_detect(deceased_additional_info, "prisoner") ~ "prisoner",
    .default = ""
  )) |>
  # tweak/tidy up cause of death; shorten a couple of excessively long ones
  mutate(cause_of_death = case_when(
    str_detect(cause_of_death,"trying to get into her house during the night while drunk") ~ "trying to get into her house at night while drunk, got stuck and choked",
    str_detect(cause_of_death, "fell over a quantity of bricks and rubbish") ~ "fell over some bricks and rubbish that were lying in the footway",
    is.na(cause_of_death) ~ "[unrecorded]",
    cause_of_death=="[unknown]" ~ "[unrecorded]",
    .default = cause_of_death
  )) |>
  # tidy up parish for display
  mutate(parish = case_when(
    parish=="St Ann" ~ "St Anne Soho",
    parish=="St James" ~ "St James Westminster",
    parish=="St Margaret" ~ "St Margaret Westminster",
    parish=="St John the Evangelist" ~ "St John the Evangelist Westminster",
 #   .default = parish
 # )) |>
 # # for mapping/counting etc put whitehall in parish. keep westmr abbey for now.
 #mutate(location = case_when(
    #parish %in% c("Westminster Abbey") ~ "St Margaret Westminster",
    parish =="Whitehall" ~ "St Martin in the Fields",
    .default = parish
  )) |>
  #there are 5 verdicts incl undetermined which can be a pita in facets but i'm not sure that's much of an excuse to leave it out
  #filter(verdict !="undetermined") |>
  mutate(doc_year = year(doc_date)) |>
  # numeric day of year for sorting
  mutate(day = yday(doc_date))  |>
  # decade 0-9
  mutate(decade = doc_year - (doc_year %% 10)) |>
  # 5 year periods
  mutate(p5 = glue("{doc_year - (doc_year %% 5)}-{doc_year - (doc_year %% 5)+4}")) |>
  # numeric month of year
  mutate(doc_month = month(doc_date)) |>
  mutate(doc_month_lab = month(doc_date, label=TRUE)) |>
  mutate(q = quarter(doc_date)) |>
  mutate(quarter = case_when(
    q==1 ~ "Winter",
    q==2 ~ "Spring",
    q==3 ~ "Summer",
    q==4 ~ "Autumn"
  ))
  
  
parishes <-
inquests |>
	count(parish, name="frequency")
	
monthly_inquests <-
	inquests |>
	count(doc_month, doc_year)
