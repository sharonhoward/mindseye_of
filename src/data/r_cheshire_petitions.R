library(mindseyedata)


# slightly adjust topics in the petitions
# (there's only a single instance of imprisoned debtors in Cheshire)
cheshire_petitions <-
cheshire_petitions |>
  mutate(topic = if_else(topic=="imprisoned debtors", "other", topic)) |>
  #are all na gender collective? yes. 
  #but on behalf collective are not na; removing on behalf so i think better to make all collective na.
  mutate(petition_gender = case_when(
    is.na(petition_gender) ~ "na", 
    petition_type=="collective" ~ "na",
    petition_gender=="m" ~ "male",
    petition_gender=="f" ~ "female",
    petition_gender=="fm" ~ "mixed"
    )) |>
  mutate(date2 = case_when(
    year < 1600 ~ "1500s",
    year > 1700 ~ "1700s",
    .default = as.character(year)
  )) |>
  mutate(petition_type = str_remove(petition_type, " *on behalf"))  |> 
  #filter(response!="uncertain") |> 
  # slightly simplified responses - merge non-full grants and merge written rejections 
  mutate(response = case_when( 
    response %in% c("grant_cond", "grant_part", "referred") ~ "partly granted", 
    response %in% c("nothing", "absent") ~ "rejected", 
    response=="no_response" ~ "no response",
    .default = response 
  ))  |>
  select(reference, petitioner, year, topic, petition_type, petition_gender, response, date2) 

# shouldn't need this
#petitionsNames <-
#  cheshire_petitions |> names()

